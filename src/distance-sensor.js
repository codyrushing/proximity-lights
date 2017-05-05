'use strict';
const EventEmitter = require('events');
const d3Array = require('d3-array');
const d3Scale = require('d3-scale');
const utils = require('./utils');
const config = require('./constants');

/*
http://192.168.1.240/debug/clip.html (IP of bridge)
Hue System API:
https://developers.meethue.com/documentation/core-concepts
*/

const range = [6, 254];
const sampleSize = 10;
const rawValuesLength = 40;
var cycle = 0;
var rawBatch = [];
var exitThresholdScale = d3Scale.scaleLinear();
exitThresholdScale.domain([6, config.MAX_USABLE_DISTANCE]);
exitThresholdScale.range([4, rawValuesLength]);

const SerialPort = require('serialport');
class DistanceSensor extends EventEmitter {
  constructor({serialPath}){
    super();
    this.init(serialPath);
    return this;
  }

  getState(){
    var state = {};
    ['distance', 'velocity', 'occupantsCount', 'isMoving', 'isEmpty', 'movementLong', 'movementShort'].forEach(prop => {
      state[prop] = this[prop];
    });
    return state;
  }

  init(serialPath){
    this.serialPath = serialPath;
    this.setInitialState();
    this.vals = [];
    this.vals.length = rawValuesLength;
    this.vals.fill(config.MAX_USABLE_DISTANCE);
    this.rawVals = [];
    this.rawVals.length = rawValuesLength;
    this.rawVals.fill(255);
    this.velocityVals = [];
    this.velocityVals.length = 10;
    this.velocityVals.fill(0);
    this.update();
    this.send();

    this.port = new SerialPort(this.serialPath,{
      // this sensor prepends 'R' before each value
      parser: SerialPort.parsers.readline('R')
    });

    this.port
      .on('open', () => {
        console.log(`${this.serialPath} channel opened`);
      })
      .on('data', data => this.on_data(data));
  }

  setInitialState(){
    this.hasTarget = false;
    this.velocity = 0;
    this.distance = 255;
    this.occupantsCount = 0;
    this.isMoving = false;
    this.isEmpty = true;
    this.movementShort = 0;
    this.movementLong = 0;
    this.exitTime = Date.now();
    this.sampleTime = Date.now();
  }

  filterBadValues(arr){
    const mean = d3Array.mean(arr);
    if(mean > 180){
      // likely empty, filter non 255s which are noise
      return arr.filter(v => v > 250).map(v => config.MAX_USABLE_DISTANCE);
    } else {
      // likely not empty, so try to filter out 255s by removing anything above Q3
      let min = d3Array.min(arr);
      return arr.filter(v => v <= min + (mean-min)*1.5);
    }
    // return utils.filterOutliers(arr).map(v => v > config.MAX_USABLE_DISTANCE ? config.MAX_USABLE_DISTANCE : v);
  }

  on_data(data){
    const distance = parseInt(data, 10);
    var addGoodValue = v => {
      this.vals = [v].concat(this.vals).slice(0,200);
      this.update();
      process.nextTick(this.send.bind(this));
    }
    if(!isNaN(distance)){
      // save up to 100 values, which corresponds to 10 secs of data
      this.rawVals = [distance].concat(this.rawVals).slice(0,rawValuesLength);
      const exitThreshold = Math.round(exitThresholdScale(d3Array.mean(this.vals.slice(0,4))));
      if(this.hasTarget){
        // if the last X num of readings (based on distance) are misses, then we're empty
        if(!this.rawVals.slice(0, exitThreshold).find(v => v < 255)){
          this.hasTarget = false;
          addGoodValue(config.MAX_USABLE_DISTANCE);
        } else if(distance < 250 && Math.abs(distance - d3Array.mean(this.rawVals.filter(v => v < 250).slice(0,3))) < 10) {
          addGoodValue(Math.min(config.MAX_USABLE_DISTANCE, distance));
        }
      } else {
        // if the last four are all legit, then something is there
        // TODO, make the # of legit values higher for further distances
        if( !this.rawVals.slice(0,4).find(v => v > 250) ) {
          // there's something there
          addGoodValue(distance);
          this.hasTarget = true;
        }
      }
    }
  }

  send(){
    this.emit('state', this.getState());
  }

  triggerEvent(event, data){
    this.emit(event, data);
  }

  on_enter(){
    this.occupantsCount += 1;
    this.isEmpty = false;
    this.triggerEvent('enter');
  }

  on_exit(){
    this.occupantsCount = Math.max(this.occupantsCount - 1, 0);
    this.isEmpty = true;
    this.exitTime = Date.now();
    this.triggerEvent('exit');
  }

  on_movement(movementFactor){
    this.isMoving = true;
    this.triggerEvent('movement', movementFactor);
  }

  on_stillness(){
    this.isMoving = false;
    this.triggerEvent('stillness');
  }

  getMovementFactor(vals){
    // remove obvious outliers, if it is far outside the mean, then throw it out
    const mean = d3Array.mean(vals);
    vals = vals.filter(v => Math.abs(v - mean) < vals.length * 5);
    if(!vals.length) return 0;
    return utils.MAD(vals);
    // return Math.log(d3Array.variance(vals) + 1);
  }

  update(){
    const now = Date.now();
    this.distance = this.vals[0];
    // below than 10 is noise, 10 - 50 is the real movement range
    this.velocity = this.vals.slice(0, sampleSize*2).find(v => v === config.MAX_USABLE_DISTANCE) ?
      0 :
      Math.round(
        (d3Array.mean(this.vals.slice(0, sampleSize)) - d3Array.mean(this.vals.slice(sampleSize,sampleSize*2)))
        /(now - this.sampleTime)
        /sampleSize*1000
      );
    this.velocity = isNaN(this.velocity) ? 0 : this.velocity;
    // this.velocityVals = [isNaN(velocity) ? 0 : velocity].concat(this.velocityVals).slice(0,10);
    // calculate movementFactor from variance
    this.movementShort = this.getMovementFactor(this.vals.slice(0,Math.round(sampleSize/2)));
    this.movementLong = this.getMovementFactor(this.vals.slice(0,sampleSize*2));

    /*
    if empty
      listen for enter event
      listen for movement, which should also trigger an enter
    else if not empty
      listen for exit event
      listen for stillness
    */

    if(this.isEmpty){
      if(this.distance < config.MAX_USABLE_DISTANCE){
        this.on_enter();
      }
      // long term movement factor
    } else {
      if(this.distance === config.MAX_USABLE_DISTANCE){
        this.on_exit();
      } else if(this.isMoving && this.movementShort < 1){
        this.on_stillness();
      } else if(this.movementShort >= 1.5){
        this.on_movement(this.movementShort);
      }
    }

    this.sampleTime = now;

  }

}

module.exports = DistanceSensor;

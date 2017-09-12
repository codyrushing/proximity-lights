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

const upperThreshold = config.MAX_USABLE_DISTANCE;
const rangeLength = config.MAX_USABLE_DISTANCE - config.MIN_USABLE_DISTANCE;
const sampleSize = 10;
const numberOfStoredValues = 200;
var maxMovement = 0;
var exitThresholdScale = d3Scale.scaleLinear();
exitThresholdScale.domain([6, config.MAX_USABLE_DISTANCE]);
exitThresholdScale.range([4, 15]);

const quantizeScale = d3Scale.scaleQuantize()
  .domain([config.MIN_USABLE_DISTANCE, config.MAX_USABLE_DISTANCE])
  .range(
    d3Array.range(2, 24, 1)
  );

const SerialPort = require('serialport');
const rawValueIsAMiss = function(rawVal){
  return rawVal > upperThreshold;
};

class DistanceSensor extends EventEmitter {
  constructor({serialPath, lightId}){
    super();
    this.lightId = lightId;
    this.init(serialPath);
    return this;
  }

  getState(){
    var state = {};
    ['distance', 'velocity', 'occupantsCount', 'isMoving', 'isEmpty', 'movementLong', 'movementShort']
    .forEach(prop => {
      state[prop] = this[prop];
    });
    return state;
  }

  init(serialPath){
    this.serialPath = serialPath;
    this.setInitialState();
    this.vals = [];
    this.vals.length = numberOfStoredValues;
    this.vals.fill(config.MAX_USABLE_DISTANCE);
    this.timestamps = [];
    this.timestamps.length = numberOfStoredValues;
    this.timestamps.fill(Date.now());
    this.rawVals = [];
    this.rawVals.length = numberOfStoredValues;
    this.rawVals.fill(upperThreshold);
    this.velocityVals = [];
    this.velocityVals.length = 10;
    this.velocityVals.fill(0);
    process.nextTick(
      () => {
        this.update();
        this.send();
      }
    )

    this.port = new SerialPort(this.serialPath,{
      // this sensor prepends 'R' before each value
      parser: SerialPort.parsers.readline('R')
    });

    this.port
      .on('open', () => {
        console.log(`${this.serialPath} channel opened`);
      })
      .on('error', err => {
        console.error(`Could not open serial port: ${err.message}`);
      });

    setTimeout(
      () => {
        this.port
          .on('data', data => this.on_data(data));
      },
      1000
    );
  }

  setInitialState(){
    this.hasTarget = false;
    this.velocity = 0;
    this.distance = upperThreshold;
    this.occupantsCount = 0;
    this.isMoving = false;
    this.isEmpty = true;
    this.movementShort = 0;
    this.movementLong = 0;
    this.exitTime = Date.now();
    this.sampleTime = Date.now();
  }

  on_data(data){
    const distance = parseInt(data, 10);
    var addGoodValue = (v, silent) => {
      this.vals = [v].concat(this.vals).slice(0, numberOfStoredValues);
      this.timestamps = [Date.now()].concat(this.timestamps).slice(0, numberOfStoredValues);
      if(!silent){
        this.update();
        process.nextTick(this.send.bind(this));
      }
    }
    if(!isNaN(distance)){
      // save up to 100 values, which corresponds to 10 secs of data
      this.rawVals = [distance].concat(this.rawVals).slice(0,numberOfStoredValues);
      const exitThreshold = Math.round(exitThresholdScale(d3Array.mean(this.vals.slice(0,4))));
      if(this.hasTarget){
        // if the last X num of readings (based on distance) are misses, then we're empty
        if(!this.rawVals.slice(0, exitThreshold).find(v => !rawValueIsAMiss(v))){
          this.hasTarget = false;
          addGoodValue(config.MAX_USABLE_DISTANCE);
        }
        // we got a value beneath our threshold that is not too far out of bounds with the last 5 raw readings
        else if(!rawValueIsAMiss(distance) && Math.abs(distance - d3Array.mean(this.rawVals.filter(v => v < upperThreshold).slice(0,5))) < 10) {
          // we got a legit good value
          addGoodValue(distance);
        }
        else if(rawValueIsAMiss(distance)) {
          // we got a miss, but just fill it in with most recent good value
          addGoodValue(this.vals[0]);
        }
      } else {
        const avgDistance = d3Array.mean(this.rawVals.slice(0, 2));
        let recentRawVals = this.rawVals.slice(
          0,
          quantizeScale(avgDistance)
        );
        // if the last five are all legit, then something is there
        // TODO, make the # of legit values higher for further distances
        if( !recentRawVals.find(v => rawValueIsAMiss(v)) ) {
          // there's something there
          recentRawVals.reverse().forEach((v,i) => {
            addGoodValue(distance, i < recentRawVals.length-1);
          });
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
    const mean = d3Array.mean(vals);
    const smoothing = (mean - config.MIN_USABLE_DISTANCE) * 0.8 / rangeLength;
    var timestamps = [];
    vals = vals.filter(
      (v, i) => {
        if(v < config.MAX_USABLE_DISTANCE){
          timestamps.push(this.timestamps[i]);
          return true;
        }
        return false;
      }
    );
    return utils.wiggle(vals, timestamps, smoothing);
    // return utils.IQR(vals);
    // return utils.MAD(vals);
    // return Math.log(d3Array.variance(vals) + 1);
  }

  update(){
    const now = Date.now();
    this.distance = this.vals[0];
    // console.log(this.distance);
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
    // this.movementShort = this.getMovementFactor(this.vals.slice(0,Math.round(sampleSize/2)));
    this.movementLong = this.getMovementFactor(this.vals.slice(0,sampleSize*2));
    console.log(this.movementLong);
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
      } else if(this.movementShort >= 1){
        this.on_movement(this.movementShort);
      }
    }

    this.sampleTime = now;

  }

}

module.exports = DistanceSensor;

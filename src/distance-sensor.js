'use strict';
const EventEmitter = require('events');
const d3Array = require('d3-array');
const utils = require('./utils');

/*
http://192.168.1.240/debug/clip.html (IP of bridge)
Hue System API:
https://developers.meethue.com/documentation/core-concepts
*/

const range = [6, 254];
const sampleSize = 10;
const sampleRate = 0.05;
const movementThreshold = 300; // inches per second

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

    this.port = new SerialPort(this.serialPath,{
      // this sensor prepends 'R' before each value
      parser: SerialPort.parsers.readline('R')
    });

    this.port
      .on('open', () => console.log(`${this.serialPath} channel opened`))
      .on('data', data => this.on_data(data));
  }

  setInitialState(){
    this.missedTargetCount = 0;
    this.hasNoisyData = false;
    this.isMissingTarget = false;
    this.velocity = 0;
    this.distance = 255;
    this.occupantsCount = 0;
    this.isMoving = false;
    this.isEmpty = true;
    this.movementShort = 0;
    this.movementLong = 0;
    this.exitTime = Date.now();
  }

  on_data(data){
    const distance = parseInt(data, 10);
    if(!isNaN(distance)){
      // save up to 100 values, which corresponds to 10 secs of data
      this.vals = [distance].concat(this.vals).slice(0,100);
      this.filterNoise();
      this.filterMisses();
      if(!this.hasNoisyData && !this.isMissingTarget){
        this.update();
        process.nextTick(this.send.bind(this));
      }
    }
  }

  filterNoise(){
    const noisyDifferential = 20;
    const recentAvgDistance = d3Array.mean(this.vals.slice(1,5));
    // if previous value is possibly noisy, then measure it agains latest value to determine if it needs to be removed or not
    // if our most recent data point deviates largely from the previous 4, it could be a noisy value
    if(
      !this.hasNoisyData
      &&
      Math.abs(this.vals[0] - recentAvgDistance) > noisyDifferential
    ){
      this.hasNoisyData = true;
    }
    else if (this.hasNoisyData) {
      if(
        Math.abs(this.vals[1] - this.vals[0]) > 5
      ) {
        // remove previous value since it appears it was out of line with following value and the preceding 4 values
        this.vals.splice(1,1);
        this.missedTargetCount = 0;
      }
      this.hasNoisyData = false;
    }
  }

  filterMisses(){
    const maxNumOfMisses = 10;
    if(d3Array.mean(this.vals.slice(0,10)) > 200){
      this.isMissingTarget = true;
    }
    else if(
      this.vals[0] > 250
    ) {
      this.missedTargetCount += 1;
      if(
        this.missedTargetCount > maxNumOfMisses
      ){
        // reinsert 255s
        this.isMissingTarget = false;
        let empties = [];
        empties.length = maxNumOfMisses;
        // this.vals = empties.fill(255).concat(this.vals);
        this.missedTargetCount = 0;
      } else {
        // remove 255s from vals as they will mess up downstream calculations
        this.isMissingTarget = true;
        this.vals.splice(0,1);
      }
    }
    else {
      this.isMissingTarget = false;
      this.missedTargetCount = 0;
    }

  }

  send(){
    const nextState = this.getState();
    // console.log('emitting state');
    this.emit('state', {
      nextState,
      prevState: this.state
    });
    this.state = nextState;
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
    this.triggerEvent('move', movementFactor);
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
    const prevDistance = d3Array.mean(this.vals.slice(sampleSize,sampleSize*2));
    // calculate velocity in inches per second
    this.distance = d3Array.mean(this.vals.slice(0,sampleSize));
    this.velocity = (this.distance - prevDistance)/(sampleSize * sampleRate);
    // calculate movementFactor from variance
    this.movementShort = this.getMovementFactor(this.vals.slice(0,sampleSize*2));
    this.movementLong = this.getMovementFactor(this.vals.slice(0,sampleSize*4));

    console.log(`${now} ${this.distance}`);

    /*
    if empty
      listen for enter event
      listen for movement, which should also trigger an enter
    else if not empty
      listen for exit event
      listen for stillness
    */

    if(this.isEmpty){
      if(this.velocity < -movementThreshold){
        this.on_enter();
      }
      // long term movement factor
      // TODO - adjust these constants to reflect new movement algorithm
      if(now - this.exitTime > 1000 && this.movementLong >= 1 && this.movementLong < 200){
        this.on_enter();
        this.on_movement(this.movementShort);
      }
    } else {
      if(this.velocity > movementThreshold){
        this.on_exit();
      } else if(this.isMoving && this.movementShort < 0.2){
        this.on_stillness();
      } else if(this.movementShort >= 1){
        this.on_movement(this.movementShort);
      }
    }

  }

}

module.exports = DistanceSensor;

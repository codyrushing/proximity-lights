const d3Array = require('d3-array');
const LightChannel = require('./light-channel');
const utils = require('./utils');
/*
http://192.168.1.240/debug/clip.html (IP of bridge)
Hue System API:
https://developers.meethue.com/documentation/core-concepts
*/

const range = [6, 254];
const sampleSize = 2;
const sampleRate = 0.05;
const movementThreshold = 300; // inches per second

const SerialPort = require('serialport');
class DistanceSensor {
  constructor({serialPath, lightId}){
    this.serialPath = serialPath;
    this.lightId = lightId;
    this.init();
  }

  getState(){
    var state = {};
    ['distance', 'velocity', 'occupantsCount', 'isMoving', 'isEmpty', 'movementLong', 'movementShort'].forEach(prop => {
      state[prop] = this[prop]
    });
    return state;
  }

  init(){
    this.setInitialState();
    this.vals = [];
    // this.initLightChannel(this.lightId);

    this.port = new SerialPort(this.serialPath,{
      // this sensor prepends 'R' before each value
      parser: SerialPort.parsers.readline('R')
    });

    this.port
      .on('open', () => console.log(`${this.serialPath} channel opened`))
      .on('data', data => this.on_data(data));
  }

  setInitialState(){
    this.velocity = 0;
    this.distance = 255;
    this.occupantsCount = 0;
    this.isMoving = false;
    this.isEmpty = true;
    this.movementShort = 0;
    this.movementLong = 0;
    this.exitTime = Date.now();
  }

  initLightChannel(lightId){
    this.lightChannel = new LightChannel({
      lightId: lightId
    });
  }

  on_data(data){
    const distance = parseInt(data, 10);
    if(!isNaN(distance)){
      // save up to 100 values, which corresponds to 10 secs of data
      this.vals = [distance].concat(this.vals).slice(0,100);
      this.update();
      process.nextTick(this.send);
    }
  }

  send(){
    if(this.lightChannel){
      this.lightChannel.emit('state', this.getState());
    } else {
      console.error('No lightChannel found');
    }
  }

  triggerEvent(event, data){
    // console.log(`${event} ${data || ''}`);
    // console.log(this.occupantsCount);
    if(this.lightChannel){
      this.lightChannel.emit(event, data);
    }
  }

  on_enter(){
    this.occupantsCount += 1;
    this.isEmpty = false;
    this.triggerEvent('enter');
  }

  on_exit(){
    this.occupantsCount -= 1;
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

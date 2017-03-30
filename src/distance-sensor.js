const d3Array = require('d3-array');
const LightChannel = require('./light-channel');
/*
http://192.168.1.240/debug/clip.html (IP of bridge)
Hue System API:
https://developers.meethue.com/documentation/core-concepts
*/

const range = [6, 254];
const sampleSize = 2;
const sampleRate = 0.1;
const movementThreshold = 90; // inches per second

const SerialPort = require('serialport');
class DistanceSensor {
  constructor({serialPath, lightId}){
    this.serialPath = serialPath;
    this.lightId = lightId;
    this.init();
  }

  init(){
    this.setInitialState();
    this.vals = [];
    this.initLightChannel(this.lightId);

    this.port = new SerialPort(this.serialPath,{
      // this sensor prepends 'R' before each value
      parser: SerialPort.parsers.readline('R')
    });

    this.port
      .on('open', () => console.log(`${this.serialPath} channel opened`))
      .on('data', data => this.on_data(data));
  }

  setInitialState(){
    this.isMoving = false;
    this.isEmpty = true;
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
      setTimeout(this.update.bind(this),0);
    }
    // console.log(distance);
  }

  triggerEvent(event, data){
    console.log(event);
    if(this.lightChannel){
      this.lightChannel.emit(event, data);
    }
  }

  on_enter(){
    if(this.isEmpty){
      this.triggerEvent('enter');
      this.isEmpty = false;
    }
  }

  on_exit(){
    if(!this.isEmpty){
      this.triggerEvent('exit');
      this.isEmpty = true;
    }
  }

  on_movement(movementFactor){
    this.isEmpty = false;
    this.isMoving = true;
    this.triggerEvent('movement', movementFactor);
  }

  on_stillness(){
    this.isMoving = false;
    this.triggerEvent('stillness')
  }

  update(){
    const latestDistance = d3Array.mean(this.vals.slice(0,sampleSize));
    const prevDistance = d3Array.mean(this.vals.slice(sampleSize,sampleSize*2));
    // calculate velocity in inches per second
    const velocity = (latestDistance - prevDistance)/(sampleSize * sampleRate);
    // calculate movementFactor from variance
    const movementFactor = d3Array.variance(this.vals.slice(0,sampleSize*2))
    /*
    if empty
      listen for enter event
      listen for movement, which should also trigger an enter
    else if not empty
      listen for exit event
      listen for stillness
    */

    if(this.isEmpty){
      if(velocity < -movementThreshold){
        this.on_enter();
      }
    } else {
      if(velocity > movementThreshold){
        this.on_exit();
      } else if(this.isMoving && d3Array.variance(this.vals.slice(0,sampleSize*5)) < 0.2){
        this.on_stillness();
      } else if(movementFactor >= 1){
        this.on_movement();
      }
    }

  }

}

module.exports = DistanceSensor;

const d3Array = require('d3-array');
const LightChannel = require('./light-channel');
/*
http://192.168.1.240/debug/clip.html (IP of bridge)
Hue System API:
https://developers.meethue.com/documentation/core-concepts
*/

const range = [6, 254];

const SerialPort = require('serialport');
class DistanceSensor {
  constructor({serialPath, lightId}){
    this.serialPath = serialPath;
    this.lightId = lightId;
    this.init();
  }

  init(){
    this.still = true;
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

  initLightChannel(lightId){
    this.lightChannel = new LightChannel({
      lightId: lightId
    });
  }

  on_data(data){
    const distance = parseInt(data, 10);
    // save up to 100 values, which corresponds to 10 secs of data
    this.vals = [distance].concat(this.vals).slice(0,100);
    this.update();
  }

  triggerEvent(event, data){
    if(this.lightChannel){
      this.lightChannel.emit(event, data);
    }
  }

  update(){
    // is still
    // is moving
    // enter
    // exit
    const movementThreshold = 90;
    const latestDistance = d3Array.mean(this.vals.slice(0,2));
    const prevDistance = d3Array.mean(this.vals.slice(2,4));

    // calculate velocity in inches per second
    const velocity = (latestDistance - prevDistance)/0.2;
    if(velocity > movementThreshold){
      // exit
      // console.log(`velocity = ${velocity}`);
      this.triggerEvent('exit');
    } else if(velocity < movementThreshold*-1) {
      // enter
      // console.log(`velocity = ${velocity}`);
      this.triggerEvent('enter');
    }

    // movement needs to be more sensitive that stillness, listens to last 4 readings
    if(d3Array.deviation(this.vals.slice(0,4)) >= 1 && this.still) {
      console.log('movement');
      this.still = false;
    } else if(!this.still && d3Array.deviation(this.vals.slice(0,10)) < 0.5){
      console.log('stillness');
      this.still = true;
    }

  }

}

module.exports = DistanceSensor;

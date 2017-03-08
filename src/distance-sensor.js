const d3Array = require('d3-array');
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
    const movementThreshold = 30;
    const twoSampleAvg = d3Array.mean(this.vals.slice(0,2));
    const priorTwoSampleAvg = d3Array.mean(this.vals.slice(2,4));
    const velocity = (twoSampleAvg - priorTwoSample)/0.2;
    if(velocity > movementThreshold){
      // exit
      this.triggerEvent('exit');
    } else if(velocity < movementThreshold*-1) {
      // enter
      this.triggerEvent('enter');
    }

  }

}

module.exports = DistanceSensor;

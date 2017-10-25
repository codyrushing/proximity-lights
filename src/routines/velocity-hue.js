const { isEqual } = require('lodash');
const d3Scale = require('d3-scale');
const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');

const briScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([4, 20])
  .range([155, 255]);

const satScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([0, 10])
  // .range([1, 255]);
  .range([150, 255]);

const hueScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([config.MIN_USABLE_DISTANCE, config.MAX_USABLE_DISTANCE])
  .range([0, 46920]);

class VelocityHue extends BaseRoutine {
  init(){
    super.init();
    this.on_exit();
  }
  processSensorData(data){
    // map sensor state to light properties
    if(!this.isEmpty){
      if(Math.abs(data.velocity) > 12){
        return {
          hue: data.velocity > 0 ? 0 : 46920,
          sat: satScale(Math.abs(data.velocity)),
          bri: briScale(Math.abs(data.velocity)),
          transitiontime: 1
        }
      }
    }
    return {
      bri: 120,
      ct: 350,
      sat: 0,
      transitiontime: 4,
      blockForTime: 400
    };
  }
  on_movement(){

  }
  on_enter(){
    lightChannel.update(this.lightId, {
      on: true,
      ct: 350,
      bri: 1,
      transitiontime: 1
    });
  }
  on_exit(){
    lightChannel.update(this.lightId, {
      on: false
    });
  }
  on_sensorState(nextSensorData){
    if(
      !isEqual(this.sensorData || {}, nextSensorData)
    ){
      lightChannel.update(this.lightId, this.processSensorData(nextSensorData));
      this.sensorData = nextSensorData;
    }
  }
}

module.exports = VelocityHue;

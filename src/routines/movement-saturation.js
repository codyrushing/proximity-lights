const { isEqual } = require('lodash');
const d3Scale = require('d3-scale');
const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');

const briScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([0, 20])
  // .range([1, 255]);
  .range([1, 255]);

const satScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([0, 10])
  // .range([1, 255]);
  .range([100, 255]);

const hueScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([config.MIN_USABLE_DISTANCE, config.MAX_USABLE_DISTANCE])
  .range([0, 46920]);

class MovementSaturation extends BaseRoutine {
  init(){
    super.init();
    lightChannel.update(this.lightId, {
      ct: 350,
      bri: 1
    });
    this.on_exit();
  }
  processSensorData(data){
    // map sensor state to light properties
    console.log(data.movementLong);
    return {
      bri: Math.round(briScale(data.movementLong)),
      sat: Math.round(satScale(data.movementLong)),
      hue: Math.round(hueScale(data.distance)),
      transitiontime: 1
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

module.exports = MovementSaturation;

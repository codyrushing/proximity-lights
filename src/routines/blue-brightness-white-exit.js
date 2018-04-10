const { isEqual } = require('lodash');
const d3Scale = require('d3-scale');
const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');
const blue = config.colors[3];

// blue when present, dimmer at near or far end of spectrum, bright in the middle, low white on empty

const briScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([
    config.MIN_USABLE_DISTANCE,
    config.MIN_USABLE_DISTANCE + (config.MAX_USABLE_DISTANCE - config.MIN_USABLE_DISTANCE)/2,
    config.MAX_USABLE_DISTANCE
  ])
  .range([20, 255, 20]);

const lowState = {
  bri: 1,
  ct: 350,
  transitiontime: 2
};

class BlueBrightnessWhiteExit extends BaseRoutine {
  init(){
    super.init();
    this.goLow();
  }
  goLow(){
    return lightChannel.update(this.lightId, lowState);
  }
  processSensorData(data){
    // map sensor state to light properties
    if(!data || data.isEmpty){
      return lowState;
    }
    return {
      bri: data.isEmpty ? 1 : Math.round( briScale(data.distance) ),
      hue: blue,
      transitiontime: 1
    };
  }
  on_movement(){

  }
  on_stillness(){

  }
  on_exit(){
    this.goLow();
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

module.exports = BlueBrightnessWhiteExit;

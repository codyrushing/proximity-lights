const { isEqual } = require('lodash');
const d3Scale = require('d3-scale');
const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');

// get brighter as you get further away

const emptyLightState = {
  bri: 1,
  ct: 350,
  transitiontime: 1
};

const briScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([config.MIN_USABLE_DISTANCE, config.MAX_USABLE_DISTANCE])
  .range([255, 1]);

class InverseDistance extends BaseRoutine {
  init(){
    super.init();
    this.emptyState();
    this.i = 0;
    this.colorPoints = [0, 5000, 40000, 50000];
  }
  emptyState(){
    return lightChannel.update(
      this.lightId,
      emptyLightState
    );
  }
  processSensorData(data){
    // map sensor state to light properties
    if(!data || data.isEmpty){
      return emptyLightState;
    }
    return {
      bri: data.isEmpty ? 1 : Math.round( briScale(data.distance) ),
      ct: 350,
      transitiontime: 1
    };
  }
  on_movement(){

  }
  on_stillness(){

  }
  on_exit(){
    this.emptyState();
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

module.exports = InverseDistance;

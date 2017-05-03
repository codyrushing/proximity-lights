const { isEqual } = require('lodash');
const d3Scale = require('d3-scale');
const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');

var briScale = d3Scale.scaleLinear();
briScale.domain([config.MIN_USABLE_DISTANCE, config.MAX_USABLE_DISTANCE]);
briScale.range([1, 255]);

var ctScale = d3Scale.scaleLinear();
ctScale.domain([0, 50]);
ctScale.range([153, 500]);

class InverseProximityRoutine extends BaseRoutine {
  processSensorState(state){
    // map sensor state to light properties
    return {
      bri: state.isEmpty ? 1 : Math.round(briScale(state.distance)),
      ct: Math.round(ctScale(state.movementShort)),
      transitiontime: 1
    };
  }
  on_sensorState(nextSensorState){
    if(
      !isEqual(this.sensorState || {}, nextSensorState)
    ){
      this.sensorState = nextSensorState;
      lightChannel.update(this.lightId, this.processSensorState(this.sensorState));
    }
  }
}

module.exports = InverseProximityRoutine;

const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const { isEqual } = require('lodash');

class InverseProximityRoutine extends BaseRoutine {
  processSensorState(state){
    // map sensor state to light properties
    // console.log(state);
    return {

    };
  }
  on_sensorState(state, prevState){
    if(
      !isEqual(state, prevState)
    ){
      lightChannel.update(this.lightId, this.processSensorState(state));
    }
  }
}

module.exports = InverseProximityRoutine;

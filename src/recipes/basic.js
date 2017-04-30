const lightChannel = require('../light-channel');
const { isEqual } = require('lodash');

class BasicRecipe {
  constructor(sensor, lightId){
    this.sensor = sensor;
    this.lightId = lightId;
    this.init();
  }
  processState(state){
    // map sensor state to light properties
    return {

    };
  }
  init(){
    this.sensor.on('state', ({state, prevState}) => {
      console.log('state received in recipe');
      if(
        !isEqual(state, prevState)
      ){
        lightChannel.update(this.lightId, this.processState(state));
      }
    })

    this.sensor.on('exit', () => {
      // do something on exit
    });

    this.sensor.on('enter', () => {
      // do something on enter
    })
  }
  destroy(){
    this.sensor.removeAllListeners('state');
    this.sensor.removeAllListeners('exit');
    this.sensor.removeAllListeners('enter');
  }
}

module.exports = BasicRecipe;

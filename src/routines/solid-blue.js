const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');

class SolidBlue extends BaseRoutine {
  init(){
    return lightChannel.update(
      this.lightId,
      {
        hue: config.hues[3],
        sat: 180,
        bri: 150,
        transitiontime: 10
      }
    );
  }
}

module.exports = SolidBlue;

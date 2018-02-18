const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');

class TurnOff extends BaseRoutine {
  init(){
    return lightChannel.update(
      this.lightId,
      {
        on: false
      }
    );
  }
}

module.exports = TurnOff;

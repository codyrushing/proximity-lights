const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');

class TurnOn extends BaseRoutine {
  init(){
    return lightChannel.update(
      this.lightId,
      {
        on: true
      }
    );
  }
}

module.exports = TurnOn;

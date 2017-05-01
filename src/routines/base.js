const lightChannel = require('../light-channel');

class BaseRoutine {
  constructor(sensor, lightId){
    this.sensor = sensor;
    this.lightId = lightId;
    this.init();
  }
  // override this
  processSensorState(sensorState){
    // map sensor state to light properties
    return {};
  }
  // override this
  on_sensorState(sensorState, prevSensorState){
    lightChannel.update(this.lightId, this.processSensorState(sensorState));
  }
  on_exit(){

  }
  on_enter(){

  }
  init(){
    this.sensor.on('state', (sensorState, prevSensorState) => this.on_sensorState(sensorState, prevSensorState));
    this.sensor.on('exit', () => this.on_exit());
    this.sensor.on('enter', () => this.on_enter());
  }
  destroy(){
    this.sensor.removeAllListeners('state');
    this.sensor.removeAllListeners('exit');
    this.sensor.removeAllListeners('enter');
  }
}

module.exports = BaseRoutine;

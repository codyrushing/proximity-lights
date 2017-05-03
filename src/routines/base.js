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
    return {
      
    };
  }
  // override this
  on_sensorState(sensorState){
    lightChannel.update(this.lightId, this.processSensorState(sensorState));
  }
  on_exit(){

  }
  on_enter(){

  }
  on_movement(){

  }
  on_stillness(){

  }
  init(){
    this.sensor.on('state', (sensorState) => this.on_sensorState(sensorState));
    this.sensor.on('exit', () => this.on_exit());
    this.sensor.on('enter', () => this.on_enter());
    this.sensor.on('movement', () => this.on_movement());
    this.sensor.on('stillness', () => this.on_stillness());
  }
  destroy(){
    this.sensor.removeAllListeners('state');
    this.sensor.removeAllListeners('exit');
    this.sensor.removeAllListeners('enter');
  }
}

module.exports = BaseRoutine;

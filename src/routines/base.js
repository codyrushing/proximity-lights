const lightChannel = require('../light-channel');

class BaseRoutine {
  constructor(sensor, lightId){
    this.sensor = sensor;
    this.lightId = lightId;
    this.init();
  }
  // override this
  processSensorData(data){
    // map sensor state to light properties
    return {

    };
  }
  // override this
  on_sensorData(sensorState){
    lightChannel.update(this.lightId, this.processSensorData(data));
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
    this.state = {};
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
    this.sensor.removeAllListeners('movement');
    this.sensor.removeAllListeners('stillness');
  }
}

module.exports = BaseRoutine;

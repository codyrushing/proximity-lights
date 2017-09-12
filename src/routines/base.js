const _ = require('lodash');
const lightChannel = require('../light-channel');

class BaseRoutine {
  constructor(sensor, lightId){
    this.sensor = sensor;
    this.light = {
      id: lightId,
      on: false
    };
    this.lightId = lightId;
    this.init();
  }
  getLight(){
    return this.light;
  }
  init(){
    this.queued = [];
    this.state = {};
    this.sensor.on('state', (sensorState) => this.on_sensorState(sensorState));
    this.sensor.on('exit', () => this.on_exit());
    this.sensor.on('enter', () => this.on_enter());
    this.sensor.on('movement', () => this.on_movement());
    this.sensor.on('stillness', () => this.on_stillness());
  }
  update(data){
    return lightChannel.update(this.lightId, this.processSensorData(data));
  }
  updateLightQueued(light, data){
    return new Promise(
      resolve => {
        // set "on" property of light
        if(typeof data.on !== 'undefined'){
          light.on = data.on;
        }
        // make sure "on" is set if we forgot
        else if(!light.on && data.on !== false){
          data.on = true;
        }
        // add the action to the queued list
        this.queued.push(
          {
            fn: () => {
              lightChannel.update(
                _.clone(light.id),
                _.clone(data)
              );
            },
            data,
            resolve
          }
        );

        // iterate over the queued actions
        const iterate = () => {

          // execute the item on the top of the queue
          if(this.queued[0] && typeof this.queued[0].fn === 'function'){
            this.queued[0].fn();
            // look to transitiontime and try to resolve after it is done
            setTimeout(
              () => {
                if(this.queued[0]){
                  this.queued[0].resolve();
                  this.queued.shift();
                  iterate();
                }
              },
              (this.queued[0].data.transitiontime || 0) * 100
            );
            // set fn to null so it doesn't get re-run
            this.queued[0].fn = null;
          }
          // resolve if there are nothing else in queue
          else if(!this.queued.length) {
            resolve();
          }

        }

        // start iterating
        iterate();
      }
    );
  }

  fadeOut(light, fadeOutDuration=1000){
    return new Promise(
      resolve => {
        light.on = true;
        // Hue API won't let you set brighness to 0, so set it to 1
        this.updateLightQueued(
          light,
          {
            bri: 1,
            // convert ms to Hue time
            transitiontime: Math.round(fadeOutDuration / 100)
          }
        );
        // then, when the above transition is complete, actually turn the light off
        this.offTimeout = setTimeout(
          () => {
            light.on = false;
            this.updateLightQueued(
              light,
              {
                on: false,
                unblock: true
              }
            )
            .then(resolve);
          },
          fadeOutDuration
        );
      }
    );
  }

  // override this
  processSensorData(data){
    // map sensor state to light properties
    return {

    };
  }
  // override this
  on_sensorState(nextSensorData){
    if(
      !_.isEqual(this.sensorData || {}, nextSensorData)
    ){
      this.update(nextSensorData);
      this.sensorData = nextSensorData;
    }
  }



  on_exit(){

  }
  on_enter(){

  }
  on_movement(){

  }
  on_stillness(){

  }
  destroy(){
    this.queued = [];
    if(this.offTimeout){
      clearTimeout(this.offTimeout);
    }
    this.sensor.removeAllListeners('state');
    this.sensor.removeAllListeners('exit');
    this.sensor.removeAllListeners('enter');
    this.sensor.removeAllListeners('movement');
    this.sensor.removeAllListeners('stillness');
  }
}

module.exports = BaseRoutine;

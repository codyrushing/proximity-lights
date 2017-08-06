/*
Brightness increases with movement
Red when close, blue when far
On stillness, it heartbeats the current color
TODO use smarter async controls, similar to GroupRoutine
*/

const { isEqual } = require('lodash');
const d3Scale = require('d3-scale');
const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const constants = require('../constants');
const red = constants.hues[constants.hues.length-1];
const blue = constants.hues[3];

const blinkCycleLength = 2000;

const satScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([0, 6])
  .range([0, 100]);

const briScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([0, 5])
  .range([0, 100]);

const hueScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([constants.MIN_USABLE_DISTANCE, constants.MAX_USABLE_DISTANCE/2])
  .range([red, blue]);

class FlickerMove extends BaseRoutine {
  init(){
    super.init();
    this.on_exit();
  }
  updateLight(params){
    lightChannel.update(this.lightId, params);
  }
  clearHeartBeatTimeouts(){
    if(this.offTimeout) clearTimeout(this.offTimeout);
    if(this.cbTimeout) clearTimeout(this.cbTimeout);
  }
  clearAllTimers(){
    if(this.blinkInterval) clearInterval(this.blinkInterval);
    this.clearHeartBeatTimeouts();
  }
  turnOff(cb){
    const cycleDuration = Math.round( blinkCycleLength - 500 );
    this.clearHeartBeatTimeouts();
    if(!this.sensorData.isEmpty){
      this.on = true;
      this.updateLight({
        bri: 1,
        transitiontime: Math.round(cycleDuration / 100)
      });
      this.offTimeout = setTimeout(
        () => {
          this.on = false;
          // this.updateLight({
          //   on: false,
          //   unblock: true
          // });
          if(typeof cb === 'function'){
            this.cbTimeout = setTimeout(
              cb.bind(this),
              100
            );
          }
        },
        cycleDuration
      );
    }
  }
  processSensorData(data){
    // map sensor state to light properties
    if(data.isEmpty){
      this.on_exit();
    }
    if(data.isMoving){
      this.clearAllTimers();

      var lightData = {
        bri: 100 + briScale(data.movementLong),
        hue: Math.round(hueScale(data.distance)),
        sat: 180,
        transitiontime: 1
      };
      if(!this.on){
        lightData.on = true;
      }
      return lightData;
    }
  }

  on_stillness(){
    this.clearAllTimers();
    const heartBeat = () => {
      this.turnOff(
        () => {
          if(!this.sensorData.isEmpty){
            this.on = true;
            this.updateLight({
              on: true,
              bri: 100,
              transitiontime: 1
            });
          }
        }
      );
    };
    heartBeat();
    this.blinkInterval = setInterval(
      heartBeat,
      blinkCycleLength
    );
  }
  on_enter(){
    // this.clearAllTimers();
  }
  on_exit(){
    // this.clearAllTimers();
    // this.on = false;
    // lightChannel.update(this.lightId, {
    //   on: false,
    //   unblock: true
    // });
  }
  on_sensorState(nextSensorData){
    if(
      !isEqual(this.sensorData || {}, nextSensorData)
    ){
      this.updateLight(this.processSensorData(nextSensorData));
      this.sensorData = nextSensorData;
    }
  }
}

module.exports = FlickerMove;

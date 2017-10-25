/*
blue and red is still good
constant saturation is good
thoughts: brightness based on movement is a little bouncy, maybe use movementLong
maybe change effect on stillness
i think exit effects are always a good idea
*/

const { isEqual } = require('lodash');
const d3Scale = require('d3-scale');
const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');
const red = config.hues[config.hues.length-1];
const blue = config.hues[3];

const baselineBrightness = 50;

const satScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([0, 6])
  .range([0, 100]);

const briScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([0, 25])
  .range([15, 255-baselineBrightness]);

const hueScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([config.MIN_USABLE_DISTANCE, config.MAX_USABLE_DISTANCE])
  .range([red, blue]);

class FlickerMoveAlt extends BaseRoutine {
  init(){
    super.init();
    // start in empty mode
    this.on_exit(true);
  }
  updateLight(params){
    lightChannel.update(this.lightId, params);
  }
  clearHeartBeatTimeouts(){
    if(this.fadeInTimeout) clearTimeout(this.fadeInTimeout);
    if(this.fadeOutTimeout) clearTimeout(this.fadeOutTimeout);
  }
  processSensorData(data){
    // map sensor state to light properties
    if(!data.isEmpty){
      return {
        bri: baselineBrightness + briScale(data.movementLong),
        hue: Math.round(hueScale(data.distance)),
        sat: 180,
        transitiontime: 1
      };
    }
  }

  goLow(duration=1000){
    this.updateLight(
      {
        bri: 1,
        hue: blue,
        transitiontime: Math.round(duration / 100)
      }
    );
  }

  on_exit(force){
    if(force || !this.empty){
      this.empty = true;
      const duration = 700;
      const heartBeat = () => {
        this.goLow(duration);
        this.clearHeartBeatTimeouts();
        this.fadeOutTimeout = setTimeout(
          () => {
            this.updateLight({
              bri: baselineBrightness * 2,
              transitiontime: Math.round(duration/100)
            });
            this.clearHeartBeatTimeouts();
            this.fadeInTimeout = setTimeout(
              heartBeat,
              duration
            );
          },
          duration
        )
      };
      heartBeat();
    }
  }
  on_enter(){
    this.empty = false;
    this.clearHeartBeatTimeouts();
  }
  on_sensorState(nextSensorData){
    if(
      !isEqual(this.sensorData || {}, nextSensorData)
    ){
      this.updateLight(this.processSensorData(nextSensorData));
      this.sensorData = nextSensorData;
    }
  }
  destroy(){
    super.destroy();
    this.clearHeartBeatTimeouts();
  }
}

module.exports = FlickerMoveAlt;

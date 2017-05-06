const { isEqual } = require('lodash');
const d3Scale = require('d3-scale');
const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');

const briScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([config.MIN_USABLE_DISTANCE, config.MAX_USABLE_DISTANCE])
  // .range([1, 255]);
  .range([1, 255]);

const mvmtShortScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([2, 12])
  .range([0, 100]);

const mvmtLongScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([1, 10])
  .range([0, 1]);

const ctScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([15, 50])
  // ctScale.range([153, 500]);
  .range([250, 400]);

class InverseProximityRoutine extends BaseRoutine {
  init(){
    super.init();
    this.blinkTimer = null;
    this.i = 0;
    this.colorPoints = [0, 5000, 40000, 50000];
    this.on_exit();
  }
  colorCycle(){
    lightChannel.update(this.lightId, {
      hue: this.colorPoints[this.i],
      unblock: true,
      transitiontime: 20
    });
    this.i = this.i === 4 ? 0 : this.i+1;
  }
  processSensorData(data){
    // map sensor state to light properties
    if(data.isEmpty){
      return {
        hue: 0,
        bri: 1,
        sat: 255,
        transitiontime: 1
      }
    }
    return {
      bri: data.isEmpty ? 1 : Math.round( briScale(data.distance) ),
      ct: Math.round( ctScale(Math.abs(data.velocity)) ),
      transitiontime: 1
    };
  }
  on_exit(){
    this.blinkTimer = setInterval(
      this.colorCycle.bind(this),
      2000
    );
  }
  on_enter(){
    if(this.blinkTimer){
      clearInterval(this.blinkTimer);
    }
  }
  on_movement(){

  }
  on_stillness(){

  }
  on_sensorState(nextSensorData){
    if(
      !isEqual(this.sensorData || {}, nextSensorData)
    ){
      lightChannel.update(this.lightId, this.processSensorData(nextSensorData));
      this.sensorData = nextSensorData;
    }
  }
}

module.exports = InverseProximityRoutine;
const d3Scale = require('d3-scale');
const d3Array = require('d3-array');
const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');

const briScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([18, 50])
  .range([50, 255]);

const durationScale = d3Scale.scaleQuantize()
  .domain([config.MIN_USABLE_DISTANCE, config.MAX_USABLE_DISTANCE])
  .range(
    d3Array.range(100, 1000, 100)
  );

const hueIncrement = Math.round(config.hues[config.hues.length-1] / 50);

class StrobeDistance extends BaseRoutine {
  init(){
    super.init();
    this.sensorData = {
      distance: config.MAX_USABLE_DISTANCE
    };
    this.isEmpty = true;
  }
  // processSensorData(data){
  //   // map sensor state to light properties
  //   const bri = Math.round(briScale(data.movementLong));
  //   return {
  //     bri: isNaN(bri) ? 1 : bri,
  //     sat: config.saturations[1],
  //     transitiontime: 1,
  //   };
  // }
  getDuration(){
    return durationScale(this.sensorData.distance);
  }
  strobe(){
    const iterate = () => {
      if(this.isEmpty) return;
      return this.updateLightQueued(this.light, {
        ct: 500,
        on: true,
        bri: 50,
        transitiontime: this.getDuration()/100
      })
      .then(
        () => {
          if(this.isEmpty) return;
          return this.fadeOut(this.light, this.getDuration())
        }
      )
      .then(
        () => {
          this.recycleTimeout = setTimeout(
            () => {
              if(this.isEmpty){
                return;
              }
              iterate()
            },
            this.getDuration()
          );
        }
      );
    };
    iterate();
  }
  on_sensorState(state){
    this.sensorData = state;
  }
  on_exit(){
    this.isEmpty = true;
    if(this.recycleTimeout){
      clearTimeout(this.recycleTimeout);
    }
    this.fadeOut(this.light, this.getDuration())
  }
  on_enter(){
    this.isEmpty = false;
    this.strobe();
  }
}

module.exports = StrobeDistance;

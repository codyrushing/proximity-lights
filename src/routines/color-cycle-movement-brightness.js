const d3Scale = require('d3-scale');
const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');

const briScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([18, 50])
  .range([50, 255]);

const hueIncrement = Math.round(config.hues[config.hues.length-1] / 50);

class ColorCycleMovementBrightness extends BaseRoutine {
  init(){
    super.init();
    this.isEmpty = true;
    this.hue = 0;
    this.colorCycle();
  }
  processSensorData(data){
    // map sensor state to light properties
    if(!data) return;
    const bri = Math.round(briScale(data.movementLong));
    return {
      bri: isNaN(bri) ? 1 : bri,
      sat: config.saturations[1],
      transitiontime: 1,
    };
  }
  colorCycle(){
    const iterate = () => {
      if(this.isEmpty){
        return this.updateLightQueued(this.light, {
            bri: 20,
            hue: this.hue,
            transitiontime: 2
          })
          .then(
            () => {
              this.hue += hueIncrement;
              if(this.hue > config.hues[config.hues.length-1]){
                this.hue = 0;
              }
              return iterate();
            }
          );
      }
    };
    iterate();
  }
  on_exit(){
    this.isEmpty = true;
    this.colorCycle();
  }
  on_enter(){
    this.isEmpty = false;
    this.update(this.sensorData);
  }
}

module.exports = ColorCycleMovementBrightness;

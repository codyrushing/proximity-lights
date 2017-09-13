const d3Scale = require('d3-scale');
const lightChannel = require('../light-channel');
const BaseRoutine = require('./base');
const config = require('../constants');

const briScale = d3Scale.scaleLinear()
  .clamp(true)
  .domain([25, 60])
  .range([50, 255]);

class ColorChangeOnEnter extends BaseRoutine {
  init(){
    super.init();
    this.colorIndex = 0;
  }
  processSensorData(data){
    // map sensor state to light properties
    if(!data || data.isEmpty){
      return;
    }
    const bri = Math.round(briScale(data.movementLong));
    return {
      hue: config.hues[this.colorIndex],
      bri: isNaN(bri) ? 1 : bri,
      sat: config.saturations[1],
      transitiontime: 1,
    };
  }
  on_enter(){
    this.colorIndex += 1;
    if(this.colorIndex >= config.hues.length-2){
      this.colorIndex = 0;
    }
    this.update(this.sensorData);
  }
}

module.exports = ColorChangeOnEnter;

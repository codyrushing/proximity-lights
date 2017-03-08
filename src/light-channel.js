const EventEmitter = require('events');
const request = require('request');
const config = require('./config');

const { bridgeHost, bridgeUser} = config;

class LightChannel extends EventEmitter {
  constructor({lightId}){
    this.lightId = lightId;
    this.init();
  }
  init(){
    // bind events
    this.on('update', this.update())
  }
  update(){
    request({
      method: 'PUT',
      url: `http://${bridgeHost}/api/${bridgeUser}/lights/${this.lightId}/state`,
      json: true,
      body: {
        transitiontime: 0
      }
    });

  }
}

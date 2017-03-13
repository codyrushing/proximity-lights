'use strict';
const EventEmitter = require('events');
const request = require('request');
const config = require('./config');

const { bridgeHost, bridgeUser} = config;

class LightChannel extends EventEmitter {
  constructor(params){
    super();
    this.init(params);
  }
  init({lightId}){
    // bind events
    this.lightId = lightId;
    this.on('enter', this.on_enter);
    this.on('exit', this.on_exit);
    this.on('update', this.on_update);
  }
  on_enter(){
    console.log('enter');
  }
  on_exit(){
    console.log('exit');
  }
  on_update(){
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

module.exports = LightChannel;

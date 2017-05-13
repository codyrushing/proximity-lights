'use strict';
const request = require('request');
const config = require('./config');
const { throttle, pick } = require('lodash');
const { bridgeHost, bridgeUser} = config;
const API_ROOT = `http://${bridgeHost}/api/${bridgeUser}`;

const lightChannel = {
  blocked: {},
  APICall: throttle(
    function(lightId, data){
      request({
        method: 'PUT',
        url: `${API_ROOT}/lights/${lightId}/state`,
        json: true,
        body: Object.assign(
          {
            transitiontime: 0
          },
          pick(data, 'on', 'hue', 'sat', 'bri', 'ct', 'transitiontime')
        )
      }, (err, response, body) => {
        if(err){
          console.error(err);
        }
      });
    },
    100,
    {
      leading: true
    }
  ),
  update: function(lightId, data){
    if(!data) return;
    if(data.unblock){
      this.blocked[lightId] = false;
    }
    if(!this.blocked[lightId]){
      this.APICall(lightId, data);
      this.blocked[lightId] = !!data.block;
      if(data.blockForTime){
        this.blocked[lightId] = true;
        setTimeout(
          () => {
            this.blocked[lightId] = false;
          },
          data.blockForTime
        );
      }
    }
  }
}

module.exports = lightChannel;

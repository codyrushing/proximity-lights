'use strict';
const request = require('request');
const config = require('./config');
const { throttle, pick } = require('lodash');
const { bridgeHost, bridgeUser} = config;
const API_ROOT = `http://${bridgeHost}/api/${bridgeUser}`;

const debug = false;

const lightChannel = {
  blocked: {},
  APICall: throttle(
    function(endpoint, data){
      if(debug){
        console.log(endpoint);
        console.log(data);
      }
      request({
        method: 'PUT',
        url: `${API_ROOT}${endpoint}`,
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
    50,
    {
      leading: false
    }
  ),
  update: function(lightId, data){
    if(!data) return;
    if(data.unblock){
      this.blocked[lightId] = false;
    }
    if(!this.blocked[lightId]){
      this.APICall(
        `/lights/${lightId}/state`,
        data
      );
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
  },
  updateGroup(data){
    return this.APICall(
      `/groups/0/action`,
      data
    );
  }
}

module.exports = lightChannel;

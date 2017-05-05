'use strict';
const request = require('request');
const config = require('./config');
const { throttle } = require('lodash');
const { bridgeHost, bridgeUser} = config;
const API_ROOT = `http://${bridgeHost}/api/${bridgeUser}`;

const lightChannel = {
  blocked: {},
  update: throttle(
    function(lightId, data){
      if(data.unblock){
        this.blocked[lightId] = false;
      }
      if(!this.blocked[lightId] ){
        request({
          method: 'PUT',
          url: `${API_ROOT}/lights/${lightId}/state`,
          json: true,
          body: Object.assign({
            transitiontime: 0
          }, data)
        }, (err, response, body) => {
          if(err){
            console.error(err);
          }
        });
        this.blocked[lightId] = !!data.block;
        if(data.blockForTime){
          this.blocked[lightId] = true;
          setTimeout(
            () => {
              this.blocked[lightId] = false;
            },
            blockForTime
          );
        }
      }
    },
    100,
    {
      leading: true
    }
  )
}

module.exports = lightChannel;

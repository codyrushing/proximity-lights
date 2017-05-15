const _ = require('lodash');
const lightChannel = require('../light-channel');

class GroupRoutine {
  constructor(lightIds){
    this.pendingTimeouts = {};
    this.lights = lightIds.map(
      id => {
        return {
          id,
          on: false,
          offTimeout: null,
          cbTimeout: null
        }
      }
    );
    this.init();
  }
  init(){
    this.queued = [];
    this.turnOffAll();
    setTimeout(
      () => {
        this.lights.forEach(this.stairStepFade.bind(this));
      },
      50
    );
  }
  turnOffAll(){
    this.lights.forEach(light => {
      light.on = false;
      lightChannel.updateGroup(
        {
          on: false
        }
      );
    });
  }
  getLight(id){
    return this.lights.find(light => light.id === id);
  }
  updateLight(light, data){
    return new Promise(
      resolve => {
        if(typeof data.on !== 'undefined'){
          light.on = data.on;
        } else if(!light.on && data.on !== false){
          data.on = true;
        }
        this.queued.push(
          {
            fn: () => {
              lightChannel.update(
                _.clone(light.id),
                _.clone(data)
              );
            },
            resolve
          }
        );
        const iterate = () => {
          if(this.queued[0] && typeof this.queued[0].fn === 'function'){
            this.queued[0].fn();
            this.queued[0].resolve()
            this.queued[0].fn = null;
            setTimeout(
              () => {
                this.queued.shift();
                // console.log(this.queued.length);
              },
              100
            );
          }
          else if(!this.queued.length) {
            clearInterval(this.queueInterval);
            this.queueInterval = null;
            resolve();
          }
        }
        iterate();
        if(!this.queueInterval){
          this.queueInterval = setInterval(
            iterate,
            100
          );
        }
      }
    );
  }
  clearPendingActions(){
    Object.keys(this.pendingTimeouts).forEach(
      id => {
        if(this.pendingTimeouts[id]){
          clearTimeout(this.pendingTimeouts[id]);
        }
      }
    );
  }
  fadeOut(light, pulseDuration=2000){
    return new Promise(
      resolve => {
        const fadeOutDuration = Math.round( pulseDuration - 500 );
        // if(!light.on){
        //   return resolve();
        // }
        light.on = true;
        this.updateLight(
          light,
          {
            bri: 1,
            transitiontime: Math.round(fadeOutDuration / 100)
          }
        );
        this.offTimeout = setTimeout(
          () => {
            light.on = false;
            this.updateLight(
              light,
              {
                on: false,
                unblock: true
              }
            )
            .then(resolve);
          },
          fadeOutDuration
        );
      }
    );
  }
  stairStepFade(light){
    var i = 0;
    const count = 5;
    const turnBright = () => {
      return this.updateLight(
        light,
        {
          bri: Math.round((255/count)*(i+1))
        }
      );
    };
    const iterate = () => {
      turnBright()
        .then(
          () => this.fadeOut(light, 1000 * (i/2+1))
        )
        .then(
          () => i++
        )
        .then(
          () => {
            if(i < count){
              return iterate();
            }
          }
        );
    }
    iterate();

  }
  destroy(){

  }
}

module.exports = GroupRoutine;

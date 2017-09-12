const _ = require('lodash');
const lightChannel = require('../light-channel');

// this could be extended

class GroupRoutine {
  constructor(lightIds){
    this.lights = lightIds.map(
      id => {
        return {
          id,
          on: false
        }
      }
    );
    this.init();
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
        // set "on" property of light
        if(typeof data.on !== 'undefined'){
          light.on = data.on;
        }
        // make sure "on" is set if we forgot
        else if(!light.on && data.on !== false){
          data.on = true;
        }
        // add the action to the queued list
        this.queued.push(
          {
            fn: () => {
              lightChannel.update(
                _.clone(light.id),
                _.clone(data)
              );
            },
            data,
            resolve
          }
        );

        // iterate over the queued actions
        const iterate = () => {

          // execute the item on the top of the queue
          if(this.queued[0] && typeof this.queued[0].fn === 'function'){
            this.queued[0].fn();

            // look to transitiontime and try to resolve after it is done
            setTimeout(
              () => {
                this.queued[0].resolve();
                this.queued.shift();
                iterate();
              },
              (this.queued[0].data.transitiontime || 0) * 100
            );
            // set fn to null so it doesn't get re-run
            this.queued[0].fn = null;
          }
          // resolve if there are nothing else in queue
          else if(!this.queued.length) {
            resolve();
          } else {
            iterate();
          }

        }

        // start iterating
        iterate();
      }
    );
  }
  destroy(){
    this.queued = [];
  }
}

module.exports = GroupRoutine;

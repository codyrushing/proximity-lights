const GroupRoutine = require('./group');

class StairStepFadeRoutine extends GroupRoutine {
  init(){
    super.init();
    this.turnOffAll();
    setTimeout(
      () => {
        this.lights.forEach(this.stairStepFade.bind(this));
      },
      50
    );
  }
  fadeOut(light, pulseDuration=2000){
    return new Promise(
      resolve => {
        const fadeOutDuration = Math.round( pulseDuration - 500 );
        light.on = true;
        // Hue API won't let you set brighness to 0, so set it to 1
        this.updateLight(
          light,
          {
            bri: 1,
            // convert ms to Hue time
            transitiontime: Math.round(fadeOutDuration / 100)
          }
        );
        // then, when it's and its transition is done
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

}

module.exports = StairStepFadeRoutine;

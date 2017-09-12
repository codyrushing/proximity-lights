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
          () => this.fadeOut(light, 1000 * (i/2+1) - 500)
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
    };
    iterate();
  }

}

module.exports = StairStepFadeRoutine;

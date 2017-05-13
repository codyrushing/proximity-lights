const http = require('http');
const path = require('path');
const DistanceSensor = require('./distance-sensor');
const InverseProximityRoutine = require('./routines/inverse-distance');
const config = require('./config');
const routines = {};

// initialize sensors and set up a recipe
const distanceSensors = config.sensors.map(
  sensorData => new DistanceSensor(sensorData)
);

const applyRoutine = (routineName) => {
  try {
    const Routine = require(`./routines/${routineName}`);
    distanceSensors.forEach(sensor => {
      let routine = routines[sensor.lightId];
      if(routine){
        routine.destroy();
      }
      routines[sensor.lightId] = new Routine(sensor, sensor.lightId);
    });
  } catch(err) {
    console.error(`Error applying routine ${routineName}`, err.message);
  }
}

applyRoutine('flicker-move');

const server = http.createServer(
  (req, res) => {
    console.log(req.url);
    try {
      if(req.url.match(/^\/set-routine/)){
        let routineName = path.basename(req.url);
        applyRoutine(routineName);
      }
      res.end('OK');
    } catch(err) {
      console.error(err);
      res.end('FAIL');
    }
  }
);

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

process.on('uncaughtException', err => {
  console.error('An exception error occurred');
  console.error(err);
  process.exit();
});

process.on('error', err => {
  console.error('An application error occurred');
  console.error(err);
});

module.exports = {
  routines,
  // distanceSensors: distanceSensors
};

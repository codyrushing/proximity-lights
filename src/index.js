'use strict';
const finalhandler = require('finalhandler')
const http = require('http');
const path = require('path');
const DistanceSensor = require('./distance-sensor');
const GroupRoutine = require('./routines/group');
const config = require('./config');
const serveStatic = require('serve-static');
const routines = {};

var groupRoutine = null;

// initialize sensors and set up a recipe
const distanceSensors = config.sensors.map(
  sensorData => new DistanceSensor(sensorData)
);

const stopRoutines = () => {
  if(groupRoutine){
    groupRoutine.destroy();
    groupRoutine = null;
  }
  Object.keys(routines).forEach(
    id => {
      const routine = routines[id];
      if(routine){
        routine.destroy();
      }
    }
  );
}

const applyRoutine = routineName => {
  try {
    const Routine = require(`./routines/${routineName}`);
    stopRoutines();
    distanceSensors.forEach(sensor => {
      let routine = routines[sensor.lightId];
      routines[sensor.lightId] = new Routine(sensor, sensor.lightId);
    });
  } catch(err) {
    console.error(`Error applying routine ${routineName}`, err.message);
  }
}

const applyGroupRoutine = () => {
  try {
    stopRoutines();
    groupRoutine = new GroupRoutine(
      distanceSensors.map(s => s.lightId)
    );
  } catch(err) {
    console.error('Error applying group routine', err.stack);
  }
}

applyRoutine('distance-brightness-red-exit');
// applyGroupRoutine();

const serve = serveStatic(path.join(__dirname, 'public'));

const server = http.createServer(
  (req, res) => {
    try {
      // eg. `/set-routine/flicker-move`
      if(req.url.match(/^\/set-routine\//)){
        applyRoutine(path.basename(req.url));
        res.end('OK');
      }
      // eg. `/set-group-routine/stairstep-fade`
      if(req.url.match(/^\/set-group-routine\//)){
        applyGroupRoutine(path.basename(req.url));
        res.end('OK');
      }
      // serve static
      serve(req, res, finalhandler(req, res));
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

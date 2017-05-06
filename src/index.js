const http = require('http');
const path = require('path');
const DistanceSensor = require('./distance-sensor');
const InverseProximityRoutine = require('./routines/inverse-proximity');
const config = require('./config');
const routines = {};

// initialize sensors and set up a recipe
const distanceSensors = config.sensors.map(
  sensorData => {
    const lightId = sensorData.lightId;
    const sensor = new DistanceSensor(sensorData);
    return sensor;
  }
);

const applyRoutine = (routineName) => {
  try {
    const Routine = require(`./routines/${routineName}`);
    distanceSensors.forEach(sensor => {
      routines[sensor.lightId] = new Routine(sensor, sensor.lightId);
    })
  } catch(err) {
    console.error(`Error applying routine ${routineName}`, err.message);
  }
}

applyRoutine('inverse-proximity');

const server = http.createServer(
  (req, res) => {
    console.log(req.url);
    if(req.url.match(/^\/set-routine/)){
      let routineName = path.basename(req.url);
    }
    res.end('OK');
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

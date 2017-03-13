const DistanceSensor = require('./distance-sensor');
const config = require('./config');
config.sensors.forEach(sensor => new DistanceSensor(sensor));

process.on('error', err => {
  console.error('An application error occurred');
  console.error(err);
});

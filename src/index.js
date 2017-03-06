const DistanceSensor = require('./distance-sensor');
const config = require('./config');
config.sensors.forEach(sensor => new DistanceSensor(sensor));

const DistanceSensor = require('./distance-sensor');
const BasicRecipe = require('./recipes/basic');
const config = require('./config');
const recipes = {};

// initialize sensors and set up a recipe
const distanceSensors = config.sensors.map(
  sensorData => {
    const lightId = sensorData.lightId;
    const sensor = new DistanceSensor(sensorData);
    recipes[lightId] = new BasicRecipe(sensor, lightId);
    return sensor;
  }
);

process.on('error', err => {
  console.error('An application error occurred');
  console.error(err);
});

module.exports = {
  recipes: recipes,
  distanceSensors: distanceSensors
};

const DistanceSensor = require('./distance-sensor');
const config = {
  bridgeHost: '192.168.1.240',
  bridgeUser: 'hAGvwnwbkxtDWB3jWE9ihq1spUv3xfQhtCxtDSQn',
  sensors: [
    {
      serialPath: '/dev/ttyUSB0'
    }
  ]
};

config.sensors.forEach(sensor => new DistanceSensor(sensor));

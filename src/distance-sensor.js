const d3Array = require('d3-array');
/*
http://192.168.1.240/debug/clip.html (IP of bridge)
Hue System API:
https://developers.meethue.com/documentation/core-concepts
*/

const SerialPort = require('serialport');
class DistanceSensor {
  constructor(params){
    Object.keys(params).forEach(key => {
      this[key] = params[key];
    });
    this.init();
  }

  init(){
    this.vals = [];
    this.port = new SerialPort(this.serialPath,{
      // this sensor prepends 'R' before each value
      parser: SerialPort.parsers.readline('R')
    });

    this.port
      .on('open', () => console.log(`${this.serialPath} channel opened`))
      .on('data', data => this.on_data(data));
  }

  on_data(data){
    const distance = parseInt(data, 10);
    // save up to 100 values, which corresponds to 10 secs of data
    this.vals = [distance].concat(this.vals).slice(0,100);
    this.update();
  }

  update(){
    //
    console.log(d3Array.variance(this.vals));
  }

}

module.exports = DistanceSensor;

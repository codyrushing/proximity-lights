const d3Array = require('d3-array');
const constants = require('./constants');

module.exports = {
  filterOutliers: arr => {
    const mean = d3Array.mean(arr);
    var indeces = [];
    const goodValues = arr.filter(
      (v, i) => {
        const isGood = Math.abs(v - mean) < Math.max(mean/10, 20);
        if(isGood){
          indeces.push(i);
        }
        return isGood;
      }
    );
    return {
      indeces,
      goodValues
    };
  },
  IQR: arr => {
    arr = arr.sort((a,b) => a-b);
    if(arr.length%2){
      arr.push(d3Array.median(arr));
    }
    return d3Array.median(arr.slice(arr.length/2)) - d3Array.median(arr.slice(0,arr.length/2));
  },
  MAD: arr => {
    if(!arr || !arr.length){
      return 0;
    }
    const median = d3Array.median(arr);
    return d3Array.median(
      arr.map(v => Math.abs(median - v))
    );
  },
  wiggle: (vals, timestamps, smoothing=0.4) =>{
    if(!vals || vals.length < 1){
      return 0;
    }
    const smoothFactor = 1 - smoothing;
    var samples = 0;
    const total = vals.reduce(
      (acc, val, i) => {
        if(i < vals.length-1 && timestamps[i] !== timestamps[i+1]){
          samples += 1;
          // change in val over change in time
          acc += Math.abs(
            (vals[i] - vals[i+1]) / (timestamps[i] - timestamps[i+1])
          ) * smoothFactor;
        }
        return acc;
      },
      0
    );
    return Math.round(total / samples * 1000);
  }
}

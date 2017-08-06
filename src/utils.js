const d3Array = require('d3-array');

module.exports = {
  filterOutliers: arr => {
    const mean = d3Array.mean(arr);
    return arr.filter(v => Math.abs(v - mean) < Math.max(mean/10, 20));
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
  wiggle: (vals, timestamps) =>{
    if(!vals || vals.length > 1){
      return 0;
    }
    return vals.reduce(
      (acc, val, i) => {
        if(i && timestamps[i]){
          // change in val over change in time
          acc += (val - vals[i-1]) / (timestamps[i] - timestamps[i-1]);
        }
        return acc;
      },
      0
    ) / (vals.length-1) * 1000;
  }
}

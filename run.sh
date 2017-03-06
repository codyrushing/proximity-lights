#!/bin/bash
PI_HOST=$1;
ssh pi@$PI_HOST 'cd proximity-lights/; npm install; npm start;'

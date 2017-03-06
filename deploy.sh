#!/bin/bash
PI_HOST=$1;
tar -zcvf src.tar.gz src;
scp src.tar.gz pi@$PI_HOST:~/proximity-lights
scp package.json pi@$PI_HOST:~/proximity-lights
ssh pi@$PI_HOST 'cd proximity-lights/; rm -rf src/; tar -xvf src.tar.gz; rm src.tar.gz;'
rm -r src.tar.gz

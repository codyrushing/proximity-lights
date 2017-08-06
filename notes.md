### issues
* There may be something about the deviation algorithm I'm using to determine movement factor that returns larger or smaller number based not on movement but on distance from sensor.
* Gracing the edge of the sensing field sort of causes problems.  Perhaps mitigate this by checking for super bouncy values.
* Difficult to distinguish between a sharp sudden movement and a person walking in front.  Currently, a person has to walk about 4 - 5 feet in front of another person to trigger an enter event.
* Noise is pretty intense beyond 150in.  Probably just need to stick beneath that.  Signal is quite consistent when there is someone within that distance.
* What is the threshold between low values that are just noise when there is no target, and low values that are spotty because the target is at a distance?

### Philips Hue API notes
* There's a convoluted `xy` option, but it will likely be easier to use `hue`, `sat`, and `bri`.
* `ct` is color temperature, so warm and cold whites.  Only useful for whites - will override `hue` and `sat`.
* `"effect": "colorloop"` cycles through all colors (send `"effect": "none"` to stop).  `"alert": "select"` blinks the last color.
* You can address all lights with `/groups/0`

### Deployment
* On the TP-Link network, `bash deploy.sh 192.168.0.100`, and ssh into Pi via `ssh pi@192.168.0.100`.  That IP is reserved for the Pi on that network.
* On home network, use the hostname `codys-pi3-modb`.

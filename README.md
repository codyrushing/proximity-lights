# Proximity lights
Raspberry Pi + Ultrasonic distance sensors + Philips Hue

## [Maxbotix Ultrasonic Rangefinder - LV-EZ0](https://www.adafruit.com/products/979)

[(data sheet here)](http://maxbotix.com/documents/LV-MaxSonar-EZ_Datasheet.pdf)

### Data sources
* It outputs that data in three forms - analog voltage, PWM, and serial.
* The Raspberry Pi has no analog inputs, so that's out.  
* It's possible to get a PWM value with software, but it's difficult.  It involves reading the GPIO pin several times over a given pulse duration (or width) and converting those to a float.  This requires very precise timing, and it sounds like some people have done it, but it sounds hacky and difficult.  Also, that float value would have to be multiplied by a particular scaling factor to get a distance value.  Overall, it sounds too difficult.  Using software to write a PWM signal from the pi should work, but reading a PWM input is less reliable.  
* Serial is nice because it returns the data in exactly the form I need (integers of inches).  The sensors output the data in RS232 serial format.  The Pi has serial inputs as part of its GPIO headers.  However, the Pi uses TTL as its serial format - so to use those pins, we would need a RS232 to TTL converter.  But even then, the Pi only has one set of serial pins, so we wouldn't be able to use more than one sensor per Pi.  Using RS232 to USB cables, each sensor could be read via USB, which you can have plenty of via a USB hub.  So serial -> USB it is.

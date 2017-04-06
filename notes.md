### issues
* There may be something about the deviation algorithm I'm using to determine movement factor that returns larger or smaller number based not on movement but on distance from sensor.
* Gracing the edge of the sensing field sort of causes problems.  Perhaps mitigate this by checking for super bouncy values.
* Difficult to distinguish between a sharp sudden movement and a person walking in front.  Currently, a person has to walk about 4 - 5 feet in front of another person to trigger an enter event.

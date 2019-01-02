
var mraa = require("mraa"); //require mraa
//Initialize PWM on Digital Pin #3 (D3) and enable the pwm pin
var pwm1 = new mraa.Pwm(20);
var pwm2 = new mraa.Pwm(14);
pwm1.enable(true);
pwm2.enable(true);
//set the period in microseconds.
pwm1.period_us(1000);
pwm2.period_us(1000);

var a1 = new mraa.Gpio(33);
var a2 = new mraa.Gpio(46);
a1.dir(mraa.DIR_OUT);
a2.dir(mraa.DIR_OUT);
a1.write(1);
a2.write(1);

var b1 = new mraa.Gpio(48);
var b2 = new mraa.Gpio(36);
b1.dir(mraa.DIR_OUT);
b2.dir(mraa.DIR_OUT);
b1.write(1);
b2.write(1);

var value = 0.0;

setInterval(function () {
    if (value >= 1.0) {
        value = 0.0;
    }
    
    value = value + 0.03;
    pwm1.write(value); //Write duty cycle value. 

    console.log(pwm1.read());//read current value that is set before.
}, 3000);

/*jshint curly: true, eqeqeq: true, strict: true, latedef: true, funcscope: true*/
console.log("initializing....");
var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var childProcess = require('child_process');

var os = require('os');
var ifaces = os.networkInterfaces();
//var temporal = require('temporal');
var pngtolcd = require('png-to-lcd');
var font = require('oled-font-5x7');
var Oled = require('./oled-js/oled.js');

var five = require("johnny-five");
//var Edison = require("edison-io");
var Edison = require("galileo-io");

var board = new five.Board({
    io: new Edison()
});

//var pngtolcd = require('png-to-lcd');
var opts;
var oled = new Oled(board, five, opts);

oled.clearDisplay();
oled.setCursor(1, 1);
oled.writeString(font, 1, 'Initializing...', 1, true, 2);

var btnUp = new five.Button({
    pin: "GP47",
    invert: true
});
var btnDown = new five.Button({
    pin: "GP44",
    invert: true
});
var btnLeft = new five.Button({
    pin: "GP165",
    invert: true
});
var btnRight = new five.Button({
    pin: "GP45",
    invert: true
});
var btnSelect = new five.Button({
    pin: "GP48",
    invert: true
});
var btnA = new five.Button({
    pin: "GP49",
    invert: true
});
var btnB = new five.Button({
    pin: "GP46",
    invert: true
});

board.on("ready", function () {
    oled.clearDisplay();
    oled.setCursor(1, 1);
    oled.writeString(font, 1, "Online", 1, true, 2);

    btnA.on("press", function () {
        console.log("Press");
        oled.clearDisplay();
        ipToOled();
    });

    ipToOled();


    //    var led = new five.Led('GP40');
    //    led.blink(500);

    //    ffmpeg -i input.flv -ss 00:00:14.435 -vframes 1 out.png

    console.log("board ready");

    //    var motorA = new five.Motor(five.Motor.SHIELD_CONFIGS.SPARKFUN_DUAL_HBRIDGE_EDISON_BLOCK.A);
    //    var motorB = new five.Motor(five.Motor.SHIELD_CONFIGS.SPARKFUN_DUAL_HBRIDGE_EDISON_BLOCK.B);
    //    var standbyPin = new five.Pin(47);
    //    standbyPin.high();

    var ESC1 = new five.ESC({
        controller: "PCA9685",
        range: [0, 89],
        pin: 4,
        //        startAt: 50,
        startAt: 37,
        device: "FORWARD_REVERSE"
            //        ,neutral : 50
        ,neutral: 37
    });

    var ESC2 = new five.ESC({
        controller: "PCA9685",
        range: [0, 100],
        pin: 5,
        startAt: 50,
        device: "FORWARD_REVERSE",
        neutral: 50
    });

//    var motorA = new five.Motor({
//        controller: "GROVE_I2C_MOTOR_DRIVER",
//        pin: "A",
//    });
//    var motorB = new five.Motor({
//        controller: "GROVE_I2C_MOTOR_DRIVER",
//        pin: "B",
//    });

    var servTilt = new five.Servo({
        controller: "PCA9685",
        range: [5, 155],
        startAt: 90,
        //        offset: 0,
        offset: -20,
        pin: 0,
        center: false
    });

    var servPan = new five.Servo({
        controller: "PCA9685",
        range: [0, 180],
        startAt: 90,
        //        offset: 0,
        offset: -17,
        pin: 1,
        center: false
    });

    // Front
    var servStear1 = new five.Servo({
        controller: "PCA9685",
        range: [70, 110],
        startAt: 90,
        //        offset: 0,
        offset: -30,
        pin: 2,
        center: false
    });

    // Rear
    var servStear2 = new five.Servo({
        controller: "PCA9685",
        range: [70, 110],
        startAt: 90,
        //        offset: 0,
        offset: 30,
        pin: 3,
        center: false,
        invert: true
    });

    centerCamera(3000);

    ESCcalibrate(ESC1);

    app.get('/', function (req, res) {
        //Join all arguments together and normalize the resulting path.
        res.sendFile(path.join(__dirname + '/client', 'index.html'));
    });

    app.use(express.static(__dirname + '/client'));
    app.use('/client', express.static(__dirname + '/client'));


    io.on('connection', function (socket) {
        var speed = 50;

        socket.on("joyButton", function (msg) {
            console.log("joystick button");
            //            console.log(msg);
            console.log(msg.buttonNum);
            //            console.log(msg.buttonObj);
            switch (msg.buttonNum) {
            case 0:
                console.log("Button A");
                centerCamera(2000);
                break;
            case 1:
                console.log("Button B");
                sweep();
                break;
            case 2:
                console.log("Button X");
                servStear1.to(90);
                servStear2.to(90);
                break;
            case 3:
                console.log("Button Y");
                ESCcalibrate(ESC1);
                break;
            case 4:
                console.log("Button left upper trigger");
                break;
            case 5:
                console.log("Button right upper trigger");
                break;
            case 6:
                console.log("Button left lower trigger");
                break;
            case 7:
                console.log("Button right lower trigger");
                break;
            case 8:
                console.log("Button back");
                break;
            case 9:
                console.log("Button start");
                break;
            case 10:
                console.log("Button left joystick button");
                break;
            case 11:
                console.log("Button right joystick button");
                break;
            case 12:
                console.log("Button dpad up");
                break;
            case 13:
                console.log("Button dpad down");
                break;
            case 14:
                console.log("Button dpad left");
                break;
            case 15:
                console.log("Button right");
                break;
            default:
                console.log("unknown joystick button");
            }

        });

        //TODO: Setup ping to check if the link to the control is broken.  If so, stop the car.
        socket.on("joyAxis", function (msg) {
            console.log("joystick axis");
            console.log(msg);
            switch (msg.axisNum) {
            case 2:
                console.log("Move camera");
                var tiltAngle = msg.axisValueY * -1;
                var panAngle = msg.axisValueX * -1;
                console.log("TiltAngle: " + tiltAngle + " PanAngle: " + panAngle);
                if (tiltAngle > 0) {
                    tiltCamera(180, Math.abs(tiltAngle) / 4);
                } else if (tiltAngle < 0) {
                    tiltCamera(0, Math.abs(tiltAngle) / 4);
                } else if (panAngle > 0) {
                    panCamera(0, Math.abs(panAngle) / 4);
                } else if (panAngle < 0) {
                    panCamera(180, Math.abs(panAngle) / 4);
                } else {
                    stopPan();
                    stopTilt();
                }
                break;
            case 0:
                var rate = msg.axisValueY;
                var angle = msg.axisValueX;
                //                    if(rate > 0) {
                //                        carForward(rate, angle);
                //                    }
                //                    else if(rate < 0) {
                //                        rate = Math.abs(rate);
                //                        carReverse(rate, angle);
                //                    } else carStop();
                speed = rate;
                if (rate === 0) { carStop(); }
                else { carGo(rate); }
                var interpolAngle = ((angle / 255) * 90) + 90;
                var stAngle = (90 + angle) / 2;
                console.log("angle: " + angle + " stAngle: " + stAngle + " interpolAngle: " + interpolAngle);
                servStear1.to(interpolAngle);
                servStear2.to(interpolAngle);
                break;
            default:
            }
        });

        //        socket.on("speedChange", function(msg){
        //            speed = msg;
        ////            if(speed > 255) speed = 255;
        //            speed = speed / 255.0 * 100;
        //            if(speed > 100) speed = 100;
        //            if(speed < 0) speed = 0;
        //            console.log("speedChange: " + speed);
        //            if(motorA.isOn) { motorA.start(speed); }
        //            if(motorB.isOn) { motorB.start(speed); }
        //        });

        socket.on("sweep", function (msg) {
            console.log("sweep : " + msg);
            sweep();
        });

        function sweep() {
            servPan.sweep({
                range: [45, 135],
                duration: 15000
                    //                interval: 20000
            });
            //            servTilt.sweep({
            //                interval: 3000
            //            });
        }
        //        socket.on('buttonMode', function(msg) {
        //            console.log("buttonMode : " + msg);
        //            switch (msg.toLowerCase()) {
        //            case 'd':
        //                carReverse(speed, 0);
        //                break;
        //            case 'u':
        //                carForward(speed, 0);
        //                break;
        //            case 'r':
        //                motorA.fwd(speed);
        //                motorB.fwd(speed);
        //                break;
        //            case 'l':
        //                motorA.rev(speed);
        //                motorB.rev(speed);
        //                break;
        //            case 's':
        //                carStop();
        //                break;
        //            default:
        //                carStop();
        //            }
        //
        //        });

        //        socket.on('panTilt', function(msg) {
        //            console.log("panTilt : " + msg);
        ////            console.log("Tilt: " + servTilt.last.target + " Pan: " + servPan.last.target);
        //            var degPerSec = 15;
        //            var interpolSpeed = 0;
        //            switch (msg.toLowerCase()) {
        //                case 'u':
        //                    tiltCamera(servTilt.range[0], degPerSec);
        ////                    interpolSpeed = Math.abs(servTilt.position - servTilt.range[0])/degPerSec*1000;
        ////                    console.log(interpolSpeed);
        ////                    servTilt.to(servTilt.range[0], interpolSpeed, 10);
        //                    break;
        //                case 'd':
        //                    tiltCamera(servTilt.range[1], degPerSec);
        //                    break;
        //                case 'l':
        //                    panCamera(servTilt.range[1], degPerSec);
        ////                    interpolSpeed = Math.abs(servPan.position - servPan.range[1])/degPerSec*1000;
        ////                    console.log(interpolSpeed);
        ////                    servPan.to(servPan.range[1], interpolSpeed, 10);
        //                    break;
        //                case 'r':
        //                    panCamera(servTilt.range[0], degPerSec);
        ////                    interpolSpeed = Math.abs(servPan.position - servPan.range[0])/degPerSec*1000;
        ////                    console.log(interpolSpeed);
        ////                    servPan.to(servPan.range[0], interpolSpeed, 10);
        //                   break;
        //                default:
        //                    servTilt.stop();
        //                    servPan.stop();
        //            }
        //        });

        socket.on("centerCam", function () {
            //            servPan.center(1000);
            //            servTilt.center(1000);
            //            servTilt.to(90,1000);
            centerCamera(3000);
        });

    });

    function centerCamera(speed) {
        servPan.to(90, speed);
        servTilt.to(90, speed);
    }

    //    function carForward(rate, angle) {
    //        console.log("carForward: " + rate + " : " + angle);
    //        motorA.fwd(rate);
    //        ESC1.speed(angle);
    //
    ////        servStear1.to(angle+70);
    ////        motorA.rev(rate);
    ////        motorB.fwd(rate);
    //    }
    //
    //     function carReverse(rate, angle) {
    //        console.log("carReverse: " + rate + " : " + angle);
    //        motorA.rev(rate);
    //        ESC1.speed(angle);

    //        servStear1.to(angle+70);
    //        motorA.fwd(rate);
    //        motorB.rev(rate);
});

function carGo(speed) {
    rate = (speed + 255) / 512 * 100;
    console.log("speed: " + speed + " rate: " + rate);
    ESC1.speed(rate);
}

function carStop() {
    console.log("carStop ");
    motorA.stop();
    motorB.stop();
    ESC1.stop();
    ESC1.speed(ESC1.startAt);
}

function tiltCamera(target, rate) {
    var interpolSpeed;
    interpolSpeed = Math.abs(servTilt.position - target) / rate * 1000;
    console.log("tiltCamera: target: " + target + " rate: " + rate + " interpolSpeed: " + interpolSpeed);
    servTilt.to(target, interpolSpeed);
    //        servTilt.to(target, rate * 100, 1);
}

//    function stopTilt() {
//        servTilt.stop();
//    }

function panCamera(target, rate) {
    var interpolSpeed;
    interpolSpeed = Math.abs(servPan.position - target) / rate * 1000;
    console.log("panCamera: target: " + target + " rate: " + rate + " interpolSpeed: " + interpolSpeed);
    servPan.to(target, interpolSpeed);
    //        servTilt.to(target, rate * 100, 10);
}

//    function stopPan() {
//        servPan.stop();
//    }

function rollCamera(target, rate) {
    console.log("camera roll not implemented");
}

http.listen(4000, function () {
    console.log('Web server Active listening on *:4000');
    childProcess.exec("node ~/edi-cam/web/server/server.js&");
    setTimeout(function () {
        childProcess.exec("~/edi-cam/bin/do_ffmpeg.sh&");
    }, 7000);
});


function ESCcalibrate(ESC) {
    console.log(ESC.startAt);
    ESC.speed(ESC.startAt);
}

function ipToOled() {
    var row = 0;
    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;
        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log((row + alias) * 7 + 5, ifname + ':' + alias, iface.address);
                oled.setCursor(1, (row + alias) * 7 + 5);
                oled.writeString(font, 1, ifname + ": " + iface.address, 1, true, 2);
            } else {
                // this interface has only one ipv4 adress
                console.log((row + 1) * 7 + 5, ifname + ':' + alias, iface.address);
                oled.setCursor(1, (row + 1) * 7 + 5);
                oled.writeString(font, 1, ifname + ": " + iface.address, 1, true, 2);
            }
            ++alias;
            row = row + 1;
        });
    });
}

});

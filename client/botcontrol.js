var socket = io();

$( document ).ready(function(e) {

    socket.emit("getGpsData", 's');
    //socket.emit("speedChange", $("#slide").value);
    //$("#speedDisplay").text($("#slide").value/255*100 + "%");
    //speedChange($("#slide"));
    $("#speedDisplay").text("50%");
    if(canGame()) {

        var prompt = "To begin using your gamepad, connect it and press any button!";
        $("#gamepadPrompt").text(prompt);

        $(window).on("gamepadconnected", function() {
            hasGP = true;
            $("#gamepadPrompt").html("Gamepad connected!");
            console.log("connection event");
            repGP = window.setInterval(reportOnGamepad,100);
        });

        $(window).on("gamepaddisconnected", function() {
            console.log("disconnection event");
            $("#gamepadPrompt").text(prompt);
            window.clearInterval(repGP);
        });

        //setup an interval for Chrome
        var checkGP = window.setInterval(function() {
            console.log('checkGP');
            if(navigator.getGamepads()[0]) {
                if(!hasGP) $(window).trigger("gamepadconnected");
                window.clearInterval(checkGP);
            }
        }, 500);
    }
});

document.onbeforeunload = function(e) {
    socket.emit("user disconnect", userId);
};


/* ------------------------------------------------------------------
Joystick stuff
-------------------------------------------------------------------*/
var hasGP = false;
var repGP;
var btnState = [];
var axisState = [];

function canGame() {
    return "getGamepads" in navigator;
}

function reportOnGamepad() {
    var gp = navigator.getGamepads()[0];
    var html = "";
        html += "id: "+gp.id+"<br/>";

    for(var i=0;i<gp.buttons.length;i++) {

        html+= "Button "+(i+1)+": ";
        if(gp.buttons[i].pressed) {
            html+= " pressed";
            if (btnState[i] != gp.buttons[i].pressed) {
                socket.emit("joyButton", {buttonNum: i, buttonObj: gp.buttons[i] });
            }
        }
        btnState[i] = gp.buttons[i].pressed;
        html+= "<br/>";
    }

    for(var i=0;i<gp.axes.length; i+=2) {
        var stick = Math.ceil(i/2)+1;
        html+= "Stick "+stick+": "+gp.axes[i]+","+gp.axes[i+1]+"<br/>";
        var axisX = gp.axes[i] * -1;
        var axisY = gp.axes[i+1] * -1;
        var axisDataX = 0;
        var axisDataY = 0;
        var scalingY = 255;
        var scalingX = 255;
        
        if (axisX > 0) axisDataX = Math.floor(axisX * 100) * scalingX / 100;
        else axisDataX = Math.ceil(axisX * 100) * scalingX / 100;
        
        if (axisY > 0) {
            axisDataY = Math.floor(axisY * 100) * scalingY / 100;
        }
        else 
        {
            axisDataY = Math.ceil(axisY * 100) * scalingY / 100;
        }
            if (axisState[i] != axisX || axisState[i+1] != axisY) {
                socket.emit("joyAxis", {axisNum: i, axisValueX: axisDataX, axisValueY: axisDataY});
            }
        axisState[i] = axisX;
        axisState[i+1] = axisY;
    }

    $("#gamepadDisplay").html(html);
}

socket.on('gps', function(msg) {
    document.getElementById("gps").href = msg.link;
    document.getElementById("gps").innerHTML = msg.linkText;    
});

// Keep this for now
socket.on('user disconnect', function(msg) {
    console.log("user disconnect: " + msg);
    var element = '#'+msg;
    console.log(element);
    $(element).remove();
});

$("#fwd").on('mousedown', function(e){
    window.alert("fwd button down");
    socket.emit("buttonMode", $("#fwd").val());
});

$("#fwd").on('mouseup', function(e){
    window.alert("fwd button up");
    socket.emit("buttonMode", 's');
});

$("#left").on('mousedown', function(e){
    socket.emit("buttonMode", $("#left").val());
});

$("#left").on('mouseup', function(e){
    socket.emit("buttonMode", 's');
});

$("#right").on('mousedown', function(e){
    socket.emit("buttonMode", $("#right").val());
});

$("#right").on('mouseup', function(e){
    socket.emit("buttonMode", 's');
});

$("#back").on('mousedown', function(e){
    socket.emit("buttonMode", $("#back").val());
});

$("#back").on('mouseup', function(e){
    socket.emit("buttonMode", 's');
});

$("#stop").on('click', function(e){
    socket.emit("buttonMode", $("#stop").val());
});

$("#tiltUp").on('mousedown', function(e){
    socket.emit("panTilt", $("#tiltUp").val());
});

$("#tiltDown").on('mousedown', function(e){
    socket.emit("panTilt", $("#tiltDown").val());
});

$("#panLeft").on('mousedown', function(e){
    socket.emit("panTilt", $("#panLeft").val());
});

$("#panRight").on('mousedown', function(e){
    socket.emit("panTilt", $("#panRight").val());
});

$("#panRight").on('mousedown', function(e){
    socket.emit("panTilt", $("#panRight").val());
});


$("#tiltUp").on('mouseup', function(e){
    socket.emit("panTilt", $("#panTiltStop").val());
});

$("#tiltDown").on('mouseup', function(e){
    socket.emit("panTilt", $("#panTiltStop").val());
});

$("#panLeft").on('mouseup', function(e){
    socket.emit("panTilt", $("#panTiltStop").val());
});

$("#panRight").on('mouseup', function(e){
    socket.emit("panTilt", $("#panTiltStop").val());
});

$("#panRight").on('mouseup', function(e){
    socket.emit("panTilt", $("#panTiltStop").val());
});

$("#panTiltStop").on('click', function(e){
    socket.emit("panTilt", $("#panTiltStop").val());
});

function speedChange(obj) {
    socket.emit("speedChange", obj.value);
    $("#speedDisplay").text(parseInt(obj.value/255.0*100) + "%");
}

function buttonMode(obj) {
    socket.emit("buttonMode", obj.value);
}

function stop(obj) {
    socket.emit("buttonMode", 's');
}

function panTilt(obj) {
    socket.emit("panTilt", obj.value);
}

function restartFFMEG(obj) {
//    socket.emit("restartFFMPEG", obj.value);
    socket.emit("sweep", obj.value);
}

function centerCam(obj) {
    socket.emit("centerCam", obj.value);
}



/*jslint vars: true*/
"use strict";

var socket = io.connect();

socket.on('processing', function () {
    document.getElementById("countdown").innerHTML = "";
    document.getElementById("loading").style.display = "inline-block";
});

socket.on('ends', function (lastShot) {
    var url = "http://192.168.0.103:4242" + lastShot;
    document.getElementById("loading").style.display = "none";
    document.getElementById("overlay").style.display = "none";
    document.getElementById("overlay").style.backgroundColor = "rgba(255,255,255)";
    document.getElementById('visu').setAttribute('src', url);
    document.getElementById("countdown").innerHTML = "3";
    document.getElementById('trigger').style.display = "none";

    setTimeout(function () {
        document.getElementById('visu').setAttribute('src', "http://192.168.0.103:9000/?action=stream");
        document.getElementById('trigger').style.display = "inline-block";
    }, 5000);
});

function fullscreen() {
    var i = document.documentElement;

    // go full-screen
    if (i.requestFullscreen) {
        i.requestFullscreen();
    } else if (i.webkitRequestFullscreen) {
        i.webkitRequestFullscreen();
    } else if (i.mozRequestFullScreen) {
        i.mozRequestFullScreen();
    } else if (i.msRequestFullscreen) {
        i.msRequestFullscreen();
    }
}

function shoot() {
    document.getElementById("overlay").style.display = "block";

    var count = 2;

    socket.emit('shoot');

    var countdown = setInterval(function () {
        if (count === 0) {
            clearInterval(countdown);

            document.getElementById("countdown").innerHTML = "Cheese !";
            document.getElementById("overlay").style.backgroundColor = "rgb(255,255,255)";
            document.getElementById('visu').setAttribute('src', '');

            socket.emit('ready');

        } else {
            document.getElementById("countdown").innerHTML = count.toString();
            count -= 1;
        }
    }, 2000);
}
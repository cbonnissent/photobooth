/*The MIT License (MIT)

Copyright (c) 2015 LEMARCHAND Guillaume

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

/*jslint vars: true*/
"use strict";

// Configuration
var PREVIEW_TIME = 5000;
var COUNTDOWN_TIMING = 1000;
var BASE_COUNTDOWN_VALUE = 3;


// web scoket connection
var socket = io.connect();


var serverHostname = window.location.hostname;
var serverPort = window.location.port;
var serverProtocol = window.location.protocol;

// build url of the mjpeg streaming
var streamURL = serverProtocol + '//' + serverHostname + ':9000/?action=stream';

// set the stream on the 'visu' element
document.getElementById('visu').setAttribute('src', streamURL);

/* Web socket events */

// 'processing' : start of the post-processing
socket.on('processing', function () {
    document.getElementById("countdown").innerHTML = "";
    document.getElementById("loading").style.display = "inline-block";
});

// 'ends': all pciture are ready, display the lastshot for 5s
socket.on('ends', function (lastShot) {
    var url = window.location.origin + lastShot;
    document.getElementById("loading").style.display = "none";
    document.getElementById("overlay").style.display = "none";
    document.getElementById("overlay").style.backgroundColor = "rgba(255,255,255)";
    document.getElementById('visu').setAttribute('src', url);
    document.getElementById("countdown").innerHTML = BASE_COUNTDOWN_VALUE.toString();
    document.getElementById('trigger').style.display = "none";

    setTimeout(function () {
        document.getElementById('visu').setAttribute('src', streamURL);
        document.getElementById('trigger').style.display = "inline-block";
    }, PREVIEW_TIME);
});

/* Action function */


/**
 * Switch to fullscreen if possible
 */
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


/**
 * Send the shot command to the server
 */
function shoot() {
    document.getElementById("overlay").style.display = "block";
    document.getElementById("countdown").innerHTML = BASE_COUNTDOWN_VALUE.toString();

    var count = BASE_COUNTDOWN_VALUE - 1;

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
    }, COUNTDOWN_TIMING);
}
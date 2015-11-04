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

/*jslint node: true*/
/*jslint bitwise: true */
/*jslint vars: true*/
/*jslint nomen: true*/
/*global require*/
"use strict";

var express = require("express");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var exec = require('child_process').exec;
var pm2 = require('pm2');

var shotNumber = 0;


/**
 * Format log output width [DATE] - [MESSAGE]
 * @param {String} str Message to log
 */
function log(str) {
    var date = new Date();
    console.log(date.toUTCString(), '-', str);
}


function pictureProcess(filename, callback) {

    log('Take picture ' + (shotNumber + 1));

    var cmd = 'raspistill -t 500 -w 1400 -h 999 -o ' + filename + '_' + shotNumber + '.jpg';

    exec(cmd, function (err, stdout, stderr) {
        if (err) {
            log('Picture command error');
            return callback(err);
        } else {

            shotNumber += 1;

            if (shotNumber === 4) {
                return callback(null);
            } else {
                pictureProcess(filename, callback);
            }
        }
    });
}

/** 
 * Stop the video stream 
 */
function stopStream() {
    pm2.connect(function () {
        pm2.stop('streamer', function (err, proc) {
            if (!err) {
                log('Video stream is off');
                pm2.disconnect();
            }
        });
    });
}

/** 
 * Set the name, launch the shot and then post-process the picture  
 * @param {Object} socket WebSocket use by the client 
 */
function takePicture(socket) {

    var date = new Date();
    var url = "/photos/test_" + date.getFullYear() + "-" + date.getUTCMonth() + "-" + date.getDate() + "_" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds();
    var filename = "public" + url;

    pm2.connect(function () {

        shotNumber = 0;

        pictureProcess(filename, function (err) {
            if (!err) {

                socket.emit('processing');

                var cmd = 'montage -background "#FFFFFF" -geometry 700x499\\>+20+20 ' + filename + '_[0-3].jpg ' + filename + '.jpg';

                log('Start picture post-processing');

                exec(cmd, function (err, stdout, stderr) {
                    if (err) {
                        log('Error while montage command');
                    } else {
                        pm2.start('streamer', function (err, proc) {
                            if (!err) {
                                log('Pictures ready');
                                pm2.disconnect();
                                setTimeout(function () {
                                    url += '.jpg';
                                    socket.emit('ends', url);
                                }, 1000);
                            }
                        });
                    }
                });
            }
        });
    });
}

app.get("/", function (req, res) {
    res.redirect("/index.html");
});

app.use(express.static(__dirname + "/public"));
server.listen(4242, function () {
    log("Webserver is ready");
});

io.on('connection', function (socket) {
    log('Someone connected');
    socket.on('shoot', function () {
        log('Shutdown video stream');
        stopStream(socket);
    });

    socket.on('ready', function () {
        log('Take the pictures');
        takePicture(socket);
    });
});
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
var async = require('async');

var config = require('./config.json');

var SHOT_COMMAND = 'raspistill' +
    ' -t ' + config.pictures_param.timing +
    ' -w ' + config.pictures_param.width +
    ' -h ' + config.pictures_param.height +
    ' -o ';

var MONTAGE_COMMAND = 'montage' +
    ' -background ' + config.montage_param.background +
    ' -geometry ' + config.montage_param.geometry +
    ' ';

var BASE_FILENAME = '/photos/' + config.pictures_name;

var shotNumber = 0;


/**
 * Format log output width [DATE] - [MESSAGE]
 * @param {String} str Message to log
 */
function log(str) {
    var date = new Date();
    console.log(date.toUTCString(), '-', str);
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
 * Take a shot
 * @param {String} filename Full relative path of the picture
 * @param {function} callback
 */
function shotProcess(filename, callback) {

    log('Take picture ' + (shotNumber + 1));

    var cmd = SHOT_COMMAND + filename + '_' + shotNumber + '.jpg';

    exec(cmd, function (err, stdout, stderr) {
        if (err) {
            log('Picture command error');
            return callback(err);
        } else {

            shotNumber += 1;

            if (shotNumber === 4) {
                shotNumber = 0;
                return callback(null);
            } else {
                shotProcess(filename, callback);
            }
        }
    });
}

/**
 * Launch image-magick montage command
 * @param {String} filename Full relative path of the picture
 * @param {function} callback
 */
function picturePostprocessing(filename, callback) {
    var cmd = MONTAGE_COMMAND + filename + '_[0-3].jpg ' + filename + '.jpg';

    log('Start picture post-processing');

    exec(cmd, function (err, stdout, stderr) {
        if (err) {
            log('Error while montage command');
            return callback(err);
        } else {
            return callback(null);
        }
    });
}

/**
 * Restart the mjpg streaming
 * @param {function} callback
 */
function restartStream(callback) {
    pm2.connect(function () {
        pm2.start('streamer', function (err, proc) {
            if (!err) {
                log('Video stream is on');
                pm2.disconnect();

                return callback(null);
            } else {

                return callback(err);
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

    var url = BASE_FILENAME +
        "_" + date.getFullYear() +
        "-" + date.getUTCMonth() +
        "-" + date.getDate() +
        "_" + date.getHours() +
        "-" + date.getMinutes() +
        "-" + date.getSeconds();

    var filename = "public" + url;

    async.series([
            function (callback) {
            shotProcess(filename, callback)
            },

            function (callback) {
            socket.emit('processing');
            picturePostprocessing(filename, callback)
            },

            restartStream,

            function (callback) {
            url += '.jpg';
            socket.emit('ends', url);
            callback(null);
            }

        ], function (err, results) {
        if (err) {
            log(err);
        }
    });

}

app.get("/", function (req, res) {
    res.redirect("/index.html");
});

app.use(express.static(__dirname + "/public"));

server.listen(config.webserver_port, function () {
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
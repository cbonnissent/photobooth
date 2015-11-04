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

var exec = require('child_process').exec;
var child;

child = exec('/home/pi/mjpg-streamer/mjpg-streamer-experimental/mjpg_streamer -i "input_raspicam.so -fps 20 -q 50 -x 640 -y 480" -o "output_http.so -p 9000 -w /home/pi/mjpg-streamer/mjpg-streamer-experimentalwww"', function (err, stdout, stderr) {
    if (err) {
        console.log('oups', stderr);
    }
});

process.on('SIGINT', function () {
    child.kill();
});

process.on('SIGTERM', function () {
    child.kill();
});
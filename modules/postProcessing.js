'use strict'
var fs = require('fs');

exports.parseFileName = function (fullPath) {
    // some string trickery to get the file name
    var reversedPath = fullPath.split("").reverse().join("");
    var fileName = reversedPath.substring(0, reversedPath.indexOf('\\'));
    fileName = fileName.split("").reverse().join("");
    return fileName;
}

exports.copyFile = function (inbound_path, outbound_path, callback) {
    fs.copyFile(inbound_path, outbound_path, (err) => {
        if (err) {
            console.log(err);
            callback(false);
        }
        console.log('successfully copied file');
        callback(true);
    });
}

exports.moveFile = function (inbound_path, outbound_path, callback) {
    fs.rename(inbound_path, outbound_path, (err) => {
        if (err) {
            console.log(err);
            callback(false)
        }
        console.log('successfully moved file');
        callback(true);
    });
}

exports.deleteFile = function (inbound_path, callback) {
    fs.unlink(inbound_path, (err) => {
        if (err) {
            console.log(err);
            callback(false);
        }
        callback(true);
        console.log('successfully deleted file');
    });
}
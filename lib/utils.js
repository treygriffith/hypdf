/**
 * Module dependencies
 */

var fs = require('fs')
  , noop = function () {};

var utils = exports;

/**
 * Merge two or more objects together
 * @param  {Object} o1 Object to be mutated with values from `o2`
 * @param  {Object} o2 Object with properties to merge into `o1` (overwrites previous properties)
 * @return {Object}    Mutated `o1`
 */
utils.merge = function merge(o1, o2) {
  if(arguments.length > 2) {
    return utils.merge(o1, utils.merge(o2, arguments[2]));
  }

  for(var p in o2) {
    if(o2.hasOwnProperty(p)) {
      o1[p] = o2[p];
    }
  }
  return o1;
};

/**
 * Get a Buffer of file data from a filename
 * @param  {String | Buffer}   file     the raw Buffer of file data or a filename from which to fetch it
 * @param  {Function} callback evaluated with results
 */
utils.getBuffer = function getBuffer(file, callback) {
  if(file instanceof Buffer) return callback(null, file);

  if(!file || typeof file !== 'string') return callback(new Error("File must be a buffer or a filename"));

  fs.readFile(file, callback);
};

/**
 * Get Buffers of file data from an array of filenames
 * @param  {Array (String | Buffer)}   files    Array containing the raw Buffers of file data, or filenames from which to fetch it (these can be mixed)
 * @param  {Function} callback evaluated with the results
 */
utils.getBuffers = function getBuffers(files, callback) {
  var buffers = [];

  files.forEach(function (file, i) {
    utils.getBuffer(file, function (err, buffer) {
      if(err) {
        callback(err);
        return callback = noop;
      }

      if(buffers.push(buffer) === files.length) callback(null, buffers);
    });
  });
};

/**
 * Generate a callback for handling JSON responses from the API
 * @param  {Function} callback Evaluated with json response
 */
utils.jsonResponse = function jsonResponse(callback) {
  return function (err, response) {
    if(err) return callback(err);

    var json;

    try {
      json = JSON.parse(response.pdf);
    } catch(e) {
      return callback(new Error("Error parsing JSON response: "+e.message));
    }

    callback(null, json);
  };
};

/**
 * Module dependencies
 */
var request = require('request')
  , Form = require('form-data')
  , utils = require('./utils')
  , noop = function () {};

module.exports = HyPDF;

/**
 * Instantiate a new HyPDF object
 * @param {String} username HyPDF username
 * @param {String} password HyPDF password
 */
function HyPDF(username, password, options) {

  options = options || {};

  this.host = "https://www.hypdf.com/";
  this.username = username;
  this.password = password;
  this.bucket = options.bucket || "";
  this.public = options.public || false;
  this.test = options.test || false;
}

/**
 * Make a request to the HyPDF API
 * @param  {String}   endpoint endpoint of the API to make a request to
 * @param  {Object}   data     Data to pass to the API
 * @param  {Function} callback Evaluated with (err, response) with the result of the API call
 */
HyPDF.prototype.request = function (endpoint, data, _callback) {

  var json = {}
    , form
    , req;

  json.user = this.username;
  json.password = this.password;
  json.test = this.test;

  if(this.bucket) {
    json.bucket = this.bucket;
    json.public = this.public;
  }

  utils.merge(json, data);

  if(endpoint === 'htmltopdf') {
    req = request.post(this.host + endpoint, callback);
    req.json(json);
    req.setHeader('content-length', req.body.length);
  } else {

    form = new Form();

    for(var p in json) {
      if(typeof json[p] === 'boolean') {
        form.append(p, ""+json[p]);
      } else {
        form.append(p, json[p]);
      }
    }

    form.submit(this.host + endpoint, function (err, res) {
      if(err) return callback(err);
      res.on('error', callback);

      var buffer = []
        , bodyLen = 0;

      res.on("data", function (chunk) {
        buffer.push(chunk);
        bodyLen += chunk.length;
      });

      res.on("end", function () {

        if (buffer.length && Buffer.isBuffer(buffer[0])) {

          var body = new Buffer(bodyLen);
          var i = 0;
          buffer.forEach(function (chunk) {
            chunk.copy(body, i, 0, chunk.length);
            i += chunk.length;
          });

          res.body = body.toString('utf8');

        } else if (buffer.length) {
          // The UTF8 BOM [0xEF,0xBB,0xBF] is converted to [0xFE,0xFF] in the JS UTC16/UCS2 representation.
          // Strip this value out when the encoding is set to 'utf8', as upstream consumers won't expect it and it breaks JSON.parse().
          if (buffer[0].length > 0 && buffer[0][0] === "\uFEFF") {
            buffer[0] = buffer[0].substring(1);
          }
          res.body = buffer.join('');
        }

        if(res.body == undefined) {
          res.body = "";
        }

        callback(null, res, res.body);
      });
    });
  }

  function callback(err, res, body) {

    // Handle errors
    if(err) return _callback(err);
    if(res.statusCode !== 200) return _callback(new Error(endpoint + " returned status code "+res.statusCode+((res.body && res.body.message) ? " with message: "+res.body.message : "")));

    var response = {
      pages: res.headers['hypdf-pages'],
      page_size: res.headers['hypdf-page-size'],
      pdf_version: res.headers['hypdf-pdf-version']
    };

    if(json.bucket) {
      // If a bucket was passed, the response contains a url for the created file
      response.pdf = body.url;
    } else {
      // the body is the binary pdf
      response.pdf = body;
    }
    
    _callback(null, response);
  }

  return this;
};

// https://devcenter.heroku.com/articles/hypdf#htmltopdf
HyPDF.prototype.htmltopdf = function(content, options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  var data = {
    content: content
  };

  utils.merge(data, options || {});

  this.request('htmltopdf', data, callback);

  return this;
};

// https://devcenter.heroku.com/articles/hypdf#pdfinfo
/**
 * Get metadata about a pdf
 * @param  {String | Buffer}    Filename of the pdf to examine or Buffer of binary pdf data
 * @param  {Object} options     Additional API options
 * @param  {Function} callback  called with the results
 */
HyPDF.prototype.pdfinfo = function(file, options, callback) {

  var h = this;

  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  utils.getBuffer(file, function (err, binary_pdf_data) {
    if(err) return callback(err);

    var data = utils.merge({}, options || {}, {file: binary_pdf_data, bucket: false});

    h.request('pdfinfo', data, utils.jsonResponse(callback));
  });

  return this;
};


// https://devcenter.heroku.com/articles/hypdf#pdftotext
/**
 * Transform a PDF to plaintext
 * @param  {String | Buffer} file    String filename or raw Buffer of binary PDF file
 * @param  {Object} options Additional options for the request
 */
HyPDF.prototype.pdftotext = function(file, options, callback) {

  var h = this;

  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  utils.getBuffer(file, function (err, binary_pdf_data) {
    if(err) return callback(err);

    var data = utils.merge({}, options || {}, {file: binary_pdf_data, bucket: false});

    h.request('pdftotext', data, utils.jsonResponse(callback));
  });
  
  return this;
};

// https://devcenter.heroku.com/articles/hypdf#pdfextract
/**
 * Extract certain pages from a pdf
 * @param  {String | Buffer}   file     String filename or raw Buffer of binary PDF file
 * @param  {Object}   options  additional options (e.g. first_page, last_page)
 * @param  {Function} callback Evaluated with results
 */
HyPDF.prototype.pdfextract = function(file, options, callback) {

  var h = this;

  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  utils.getBuffer(file, function (err, binary_pdf_data) {
    if(err) return callback(err);

    var data = utils.merge({}, options || {}, {file: binary_pdf_data});

    h.request('pdfextract', data, callback);
  });

  return this;
};


// https://devcenter.heroku.com/articles/hypdf#pdfunite
/**
 * Merge multiple pdf files into one
 * @param  {Array(Buffer | String)}   files    Array of String filenames or raw Buffers of binary PDF files (the array can be mixed)
 * @param  {Object}   options  Additional API options for this call
 * @param  {Function} callback evaluted with the results (meta data and the merged PDF)
 */
HyPDF.prototype.pdfunite = function(files, options, callback) {

  var h = this;

  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  utils.getBuffers(files, function (err, buffers) {
    if(err) return callback(err);

    var data = utils.merge({}, options || {});

    buffers.forEach(function (buffer, i) {
      data['file_'+(i+1)] = buffer;
    });

    h.request('pdfunite', data, callback);
  });

  return this;
};
var assert = require('assert')
  , temp = require('temp')
  , fs = require('fs')
  , path = require('path')
  , HyPDF = require('../')
  , user = process.env.HYPDF_USER
  , pass = process.env.HYPDF_PASSWORD;

temp.track();

var dir = temp.mkdirSync('hypdf-test-');

var hypdf = new HyPDF(user, pass, {test: true});

describe('htmltopdf', function () {

  it("sends html and receives a pdf", function (next) {

    console.log("htmltopdf");
    hypdf.htmltopdf("<h1>Title</h1>", function (err, response) {
      assert.ifError(err);
      assert(response.pdf);

      fs.writeFileSync(path.join(dir, 'htmltopdf.pdf'), response.pdf);

      next();
    });
  });
});

describe("pdfinfo", function () {

  it("sends a pdf and gets back info", function (next) {

    fs.readFile(path.join(dir, 'htmltopdf.pdf'), function (err, pdf) {
      assert.ifError(err);

      console.log("pdfinfo");
      hypdf.pdfinfo(pdf, function (err, info) {

        assert.ifError(err);

        assert.equal(info['PDF Version'], "1.5");

        next();
      });
    });
  });
});

describe("pdftotext", function () {

  it("sends a pdf and gets back text", function (next) {

    fs.readFile(path.join(dir, 'htmltopdf.pdf'), function (err, pdf) {
      assert.ifError(err);

      console.log("pdftotext");
      hypdf.pdftotext(pdf, function (err, text) {

        assert.ifError(err);

        assert.equal(text, "Title");

        next();
      });
    });
  });
});


describe("pdfunite", function () {

  it("sends multiple pdfs and gets back one", function (next) {

    fs.readFile(path.join(dir, 'htmltopdf.pdf'), function (err, pdf) {
      assert.ifError(err);

      console.log("pdfunite");
      hypdf.pdfunite([pdf, pdf, pdf], function (err, response) {

        assert.ifError(err);

        assert(response.pdf);

        fs.writeFileSync(path.join(dir, 'pdfunite.pdf'), response.pdf);

        next();
      });
    });
  });
});

describe("pdfextract", function () {

  it("sends a pdf and gets back some pages", function (next) {

    fs.readFile(path.join(dir, 'pdfunite.pdf'), function (err, pdf) {
      assert.ifError(err);

      console.log("pdfextract");
      hypdf.pdfextract(pdf, {first_page: 1, last_page: 1}, function (err, response) {

        assert.ifError(err);

        assert(response.pdf);

        next();
      });
    });
  });
});
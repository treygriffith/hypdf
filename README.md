HyPDF
=====
### Node.js wrapper for the [HyPDF](http://www.hypdf.com) Heroku Add-on API

This is a Node.js version the [official Ruby wrapper](https://github.com/redfield/hypdf) for working with HyPDF on Heroku

Installation
-------------

Through [NPM](http://www.npmjs.org)
``` bash
$ npm install hypdf
```

 or using Git
``` bash
$ git clone git://github.com/treygriffith/hypdf.git node_modules/hypdf/
```

How to Use
----------

```javascript
var HyPDF = require('hypdf');

var hypdf = new HyPDF(process.env.HYPDF_USER, process.env.HYPDF_PASSWORD, {
  // default options to use - these can be changed for each individual API request
  bucket: "MY_S3_BUCKET",
  public: true, // all S3 uploads will be public by default
  test: true // we are in test mode - these requests won't count against our HyPDF quota
});

hypdf.htmltopdf("<html><body><h1>Title</h1></body></html>", {
    orientation: 'Landscape',
    copies: 2,
    // ... other options ...
  },
  function (err, response) {
    if(err) throw err;

    console.log(response.pdf);
  }
);

```

Documentation
-------------

Full API documentation for HyPDF can be found [here](https://devcenter.heroku.com/articles/hypdf).

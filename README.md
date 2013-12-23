etsy-jsonp
==========

JSONP Library for Etsy API

[![Build Status](https://travis-ci.org/taylorhakes/etsy-jsonp.png)](https://travis-ci.org/taylorhakes/etsy-jsonp)

100% test coverage!

To run tests
```
grunt test
```

Documentation
-------------
This Jsonp library only supports GET requests to the Etsy API.
```js
// Create a new instance of EtsyJsonp
var etsyApi = new EtsyJsonp({
	apiKey: '<YOUR_API_KEY>'
});

// Search for golf keyword
var etsyXhr = etsyApi.get({
	path: 'listings/active.js',
	// Url and path params
	params: {
	    keywords: 'golf',
	    limit: 10,
	    includes: 'Images:1'
	},
	success: function(info) {
	    console.log('success',info);
	    console.log('response',info.response);
	},
	error: function(info) {
	    console.log('error', info);
	    console.log('error text', info.error);
	},
	done: function() {
		console.log('done');
	}
});

// To abort the previous call
etsyXhr.abort();


// Search for a specific item
var etsyXhr = etsyApi.get({
	path: 'listings/:listing_id.js',
	// Url and path params
	params: {
	    listing_id: 1234
	},
	success: function(info) {
	    console.log('success',info);
	    console.log('response',info.response);
	},
	error: function(info) {
	    console.log('error', info);
	    console.log('error text', info.error);
	},
	done: function() {
		console.log('done');
	}
});
```

The MIT License (MIT)

Copyright (c) 2013 Taylor Hakes

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

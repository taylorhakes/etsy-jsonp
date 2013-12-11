etsy-jsonp
==========

JSONP Library for Etsy API

[![Build Status](https://travis-ci.org/taylorhakes/etsy-jsonp.png)](https://travis-ci.org/taylorhakes/etsy-jsonp)

Documentation
-------------
This Jsonp library only supports GET requests to the Etsy API.
```js
// Create a new instance of EtsyJsonp
var etsyApi = new EtsyJsonp({
	apiKey: '<YOUR_API_KEY>'
});

// Search for golf keyword
etsyApi.get({
	path: 'listings/active.js',
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
```

;(function(){
	'use strict';
	function spyOnJsonp(newFunc) {
		var elem = document.head || document.documentElement;
		var oldAppendChild = elem.appendChild;
		elem.appendChild = function(script) {
			elem.appendChild = oldAppendChild;
			newFunc(script.src, script);
		};
	}

	function createFakeScript() {
		var script = {
			src: ''
		};
		if (document.body.addEventListener) {
			script.addEventListener = function(event, callback) {
				script.onload = callback;
			};
		} else if (document.body.attachEvent) {
			script.attachEvent = function(event, callback) {
				script.onload = callback;
			};
		}
		return script;
	}

	function spyOnCreateElement() {
		var oldCreateElement = document.createElement;
		var script = createFakeScript();
		document.createElement = function() {
			document.createElement = oldCreateElement;
			return script;
		};
		return script;
	}


	describe('Constructor params', function() {
		it('No API Key throws error', function() {
			var error = false;
			try {
				var test = new EtsyJsonp({});
			} catch (e) {
				error = true;
			}
			expect(error).toBe(true);
		});
		it('Specifying API Key does not throw error', function() {
			var error = false;
			try {
				var test = new EtsyJsonp({
					apiKey: 'hello'
				});
			} catch (e) {
				error = true;
			}
			expect(error).toBe(false);
		});
		it('Specifying API URL changes the API URL', function() {
			var changed = false;
			spyOnJsonp(function(url) {
				if(url.match(/^http:\/\/hello/)) {
					changed = true;
				}
			});


			var test = new EtsyJsonp({
				apiUrl: 'http://hello',
				apiKey: 'test'
			});
			test.get({
				path: '/path'
			});
			expect(changed).toBe(true);
		});
	});
	describe('get function valid params', function() {
		it('Path is correct', function() {
			var changed = false;
			spyOnJsonp(function(url) {
				if (url.match(/^http:\/\/hello\/path\.js/)) {
					changed = true;
				}
			});
			var test = new EtsyJsonp({
				apiUrl: 'http://hello/',
				apiKey: 'test'
			});
			test.get({
				path: '/path.js'
			});
			expect(changed).toBe(true);
		});
		it('Params are added to URL', function() {
			var changed = false;
			spyOnJsonp(function(url) {
				if (url.match(/foo=0/) && url.match(/hello=world/)) {
					changed = true;
				}
			});
			var test = new EtsyJsonp({
				apiUrl: 'http://hello/',
				apiKey: 'test'
			});
			test.get({
				path: '/path.js',
				params: {
					hello: 'world',
					foo: 0
				}
			});
			expect(changed).toBe(true);
		});
		it('Url params are replaced', function() {
			var changed = false;
			spyOnJsonp(function(url) {
				if (url.match(/^http:\/\/hello\/path\/123\.js/) && url.match(/foo=bar/) && !url.match(/hello=/)) {
					changed = true;
				}
			});
			var test = new EtsyJsonp({
				apiUrl: 'http://hello/',
				apiKey: 'test'
			});
			test.get({
				path: '/path/:hello.js',
				params: {
					hello: 123,
					foo: 'bar'
				}
			});
			expect(changed).toBe(true);
		});
		it('Multiple Url params are replaced', function() {
			var changed = false;
			spyOnJsonp(function(url) {
				if (url.match(/^http:\/\/hello\/path\/123\/555\.js/) && url.match(/foo=bar/) && !url.match(/first=/) && !url.match(/second=/)) {
					changed = true;
				}
			});
			var test = new EtsyJsonp({
				apiUrl: 'http://hello/',
				apiKey: 'test'
			});
			test.get({
				path: '/path/:first/:second.js',
				params: {
					first: 123,
					second: 555,
					foo: 'bar'
				}
			});
			expect(changed).toBe(true);
		});
		it('Caching is on by default', function() {
			var changed = false;
			spyOnJsonp(function(url) {
				if (url.match(/___=/)) {
					changed = true;
				}
			});
			var test = new EtsyJsonp({
				apiUrl: 'http://hello/',
				apiKey: 'test'
			});
			test.get({
				path: '/path/:first/:second.js',
				params: {
					first: 123,
					second: 555,
					foo: 'bar'
				}
			});
			expect(changed).toBe(true);
		});
		it('Disable caching works', function() {
			var changed = false;
			spyOnJsonp(function(url) {
				if (!url.match(/___=/)) {
					changed = true;
				}
			});
			var test = new EtsyJsonp({
				apiUrl: 'http://hello/',
				apiKey: 'test'
			});
			test.get({
				path: '/path/:first/:second.js',
				disableCaching: true,
				params: {
					first: 123,
					second: 555,
					foo: 'bar'
				}
			});
			expect(changed).toBe(true);
		});

		it('Custom callback function name works', function() {
			var changed = false;
			var testName = 'customEtsy';
			spyOnJsonp(function() {
				if (window[testName]) {
					changed = true;
					delete window[testName];
				}
			});

			var test = new EtsyJsonp({
				apiUrl: 'http://hello/',
				apiKey: 'test'
			});
			test.get({
				path: '/path/:first/:second.js',
				callbackName: 'customEtsy',
				params: {
					first: 123,
					second: 555,
					foo: 'bar'
				}
			});
			expect(changed).toBe(true);
		});
		it('Success function works', function() {
			var changed = false;
			var testName = 'customEtsy';
			spyOnCreateElement();
			spyOnJsonp(function(url, script) {
				if (window[testName]) {
					window[testName]({
						ok: true
					});
					script.onload({
						type: null
					});
					delete window[testName];
				}
			});

			var test = new EtsyJsonp({
				apiUrl: 'http://hello/',
				apiKey: 'test'
			});
			test.get({
				path: '/path/:first/:second.js',
				callbackName: 'customEtsy',
				params: {
					first: 123,
					second: 555,
					foo: 'bar'
				},
				success: function(info) {
					if(info.response && info.response.ok) {
						changed = true;
					}
				}
			});
			expect(changed).toBe(true);
		});
		it('Error function works', function() {
			var changed = false;
			var testName = 'customEtsy';
			spyOnCreateElement();
			spyOnJsonp(function(url, script) {
				if (window[testName]) {
					window[testName]({
						ok: false,
						error: 'Weird Error'
					});
					script.onload({
						type: null
					});
					delete window[testName];
				}
			});

			var test = new EtsyJsonp({
				apiUrl: 'http://hello/',
				apiKey: 'test'
			});
			test.get({
				path: '/path/:first/:second.js',
				callbackName: 'customEtsy',
				params: {
					first: 123,
					second: 555,
					foo: 'bar'
				},
				error: function(info) {
					if (info.error === 'Weird Error') {
						changed = true;
					}
				}
			});
			expect(changed).toBe(true);
		});
		it('Done function works with error', function() {
			var changed = false;
			var testName = 'customEtsy';
			spyOnCreateElement();
			spyOnJsonp(function(url, script) {
				if (window[testName]) {
					window[testName]({
						ok: false,
						error: 'Weird Error'
					});
					script.onload({
						type: null
					});
					delete window[testName];
				}
			});

			var test = new EtsyJsonp({
				apiUrl: 'http://hello/',
				apiKey: 'test'
			});
			test.get({
				path: '/path/:first/:second.js',
				callbackName: 'customEtsy',
				params: {
					first: 123,
					second: 555,
					foo: 'bar'
				},
				done: function() {
					changed = true;
				}
			});
			expect(changed).toBe(true);
		});
		it('Done function works with success', function() {
			var changed = false;
			var testName = 'customEtsy';
			spyOnCreateElement();
			spyOnJsonp(function(url, script) {
				if (window[testName]) {
					window[testName]({
						ok: true
					});
					script.onload({
						type: null
					});
					delete window[testName];
				}
			});

			var test = new EtsyJsonp({
				apiUrl: 'http://hello/',
				apiKey: 'test'
			});
			test.get({
				path: '/path/:first/:second.js',
				callbackName: 'customEtsy',
				params: {
					first: 123,
					second: 555,
					foo: 'bar'
				},
				done: function() {
					changed = true;
				}
			});
			expect(changed).toBe(true);
		});
	});

})();

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

    // Script with an addEventListener funciton on it
	function createFakeScript(type, removeCallback) {
		var script = {
			src: '',
			parentNode: {
				removeChild: function() {
					if(removeCallback) {
						removeCallback();
					}
				}
			}
		};
        if(type === 'eventListener') {
            script.addEventListener = function(event, callback) {
                script.onload = callback;
            };
            script.removeEventListener = function(event, callback) {};
        } else if(type === 'attachEvent') {
            script.attachEvent = function(event, callback) {
                script.onload = callback;
            };
            script.detachEvent = function(event, callback) {};
        }

		return script;
	}

	function spyOnCreateElement(type, removeCallback) {
		var oldCreateElement = document.createElement;
		var script = createFakeScript(type, removeCallback);
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
	describe('get function different params', function() {
        var test = null;
        beforeEach(function() {
            test = new EtsyJsonp({
                apiUrl: 'http://hello/',
                apiKey: 'test'
            });
        });

		it('Path is correct', function() {
			var changed = false;
			spyOnJsonp(function(url) {
				if (url.match(/^http:\/\/hello\/path\.js/)) {
					changed = true;
				}
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

        it('Check original callback', function() {
            var changed = false;
            var testName = 'customEtsy';
            spyOnCreateElement('eventListener');
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
            window[testName] = function original(data) {
                if(data.ok) {
                    changed = true;
                }
                window[testName] = undefined;
            };
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
        })
	});

    describe('Check success callback', function() {
        var testName = 'customEtsy';
        var test = null;
        beforeEach(function() {
            test = new EtsyJsonp({
                apiUrl: 'http://hello/',
                apiKey: 'test'
            });
        });

        function jsonpCallback(url, script) {
            if (window[testName]) {
                window[testName]({
                    ok: true
                });
                script.onload({
                    type: null
                });
                delete window[testName];
            }
        }

        function callGet(callback) {
            test.get({
                path: '/path/:first/:second.js',
                callbackName: testName,
                params: {
                    first: 123,
                    second: 555,
                    foo: 'bar'
                },
                success: function(info) {
                    if(info.response && info.response.ok) {
                        callback();
                    }
                }
            });
        }


        it('Works with eventListener supported browsers', function() {
            var changed = false;

            spyOnCreateElement('eventListener');
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });

            expect(changed).toBe(true);
        });

        it('Works with attachEvent supported browsers', function() {
            var changed = false;

            spyOnCreateElement('attachEvent');
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });

            expect(changed).toBe(true);
        });

        it('Works with unsupported browsers eventListener or attachEvent', function() {
            var changed = false;

            spyOnCreateElement();
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });

            expect(changed).toBe(true);
        });

    });

    describe('Check error callback', function() {
        var testName = 'customEtsy';
        var test = null;
        beforeEach(function() {
            test = new EtsyJsonp({
                apiUrl: 'http://hello/',
                apiKey: 'test'
            });
        });

        function jsonpCallback(url, script) {
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
        }

        function callGet(callback) {
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
                        callback();
                    }
                }
            });
        }


        it('Works with eventListener supported browsers', function() {
            var changed = false;

            spyOnCreateElement('eventListener');
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });

            expect(changed).toBe(true);
        });

        it('Works with attachEvent supported browsers', function() {
            var changed = false;

            spyOnCreateElement('attachEvent');
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });

            expect(changed).toBe(true);
        });

        it('Works with unsupported browsers eventListener or attachEvent', function() {
            var changed = false;

            spyOnCreateElement();
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });

            expect(changed).toBe(true);
        });

    });


    describe('Check done callback with error', function() {
        var testName = 'customEtsy';
        var test = null;
        beforeEach(function() {
            test = new EtsyJsonp({
                apiUrl: 'http://hello/',
                apiKey: 'test'
            });
        });

        function jsonpCallback(url, script) {
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
        }

        function callGet(callback) {
            test.get({
                path: '/path/:first/:second.js',
                callbackName: 'customEtsy',
                params: {
                    first: 123,
                    second: 555,
                    foo: 'bar'
                },
                done: function() {
                    callback();
                }
            });
        }


        it('Works with eventListener supported browsers', function() {
            var changed = false;

            spyOnCreateElement('eventListener');
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });

            expect(changed).toBe(true);
        });

        it('Works with attachEvent supported browsers', function() {
            var changed = false;

            spyOnCreateElement('attachEvent');
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });

            expect(changed).toBe(true);
        });

        it('Works with unsupported browsers eventListener or attachEvent', function() {
            var changed = false;

            spyOnCreateElement();
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });

            expect(changed).toBe(true);
        });

    });

    describe('Check done callback with success', function() {
        var testName = 'customEtsy';
        var test = null;
        beforeEach(function() {
            test = new EtsyJsonp({
                apiUrl: 'http://hello/',
                apiKey: 'test'
            });
        });

        function jsonpCallback(url, script) {
            if (window[testName]) {
                window[testName]({
                    ok: true
                });
                script.onload({
                    type: null
                });
                delete window[testName];
            }
        }

        function callGet(callback) {
            test.get({
                path: '/path/:first/:second.js',
                callbackName: 'customEtsy',
                params: {
                    first: 123,
                    second: 555,
                    foo: 'bar'
                },
                done: function() {
                    callback();
                }
            });
        }


        it('Works with eventListener supported browsers', function() {
            var changed = false;

            spyOnCreateElement('eventListener');
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });

            expect(changed).toBe(true);
        });

        it('Works with attachEvent supported browsers', function() {
            var changed = false;

            spyOnCreateElement('attachEvent');
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });

            expect(changed).toBe(true);
        });

        it('Works with unsupported browsers eventListener or attachEvent', function() {
            var changed = false;

            spyOnCreateElement();
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });

            expect(changed).toBe(true);
        });

    });

    describe('Check abort function', function() {
        var test = null;
        beforeEach(function() {
            test = new EtsyJsonp({
                apiUrl: 'http://hello/',
                apiKey: 'test'
            });
        });

        function jsonpCallback(url, script) {
        }

        function callGet(callback) {
            var xhr = test.get({
                path: '/path/:first/:second.js',
                callbackName: 'customEtsy',
                params: {
                    first: 123,
                    second: 555,
                    foo: 'bar'
                },
                error: function(info) {
                    if (info.error === 'Request Aborted') {
                        callback();
                    }
                }
            });
            xhr.abort();

        }


        it('Works with eventListener supported browsers', function() {
            var removed = false;
            var changed = false;

            spyOnCreateElement('eventListener',function() {
                removed = true;
            });
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });
            expect(removed).toBe(true);
            expect(changed).toBe(true);
        });

        it('Works with attachEvent supported browsers', function() {
            var removed = false;
            var changed = false;

            spyOnCreateElement('attachEvent', function() {
                removed = true;
            });
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });
            expect(removed).toBe(true);
            expect(changed).toBe(true);
        });

        it('Works with unsupported browsers eventListener or attachEvent', function() {
            var removed = false;
            var changed = false;

            spyOnCreateElement(null, function() {
                removed = true;
            });
            spyOnJsonp(jsonpCallback);
            callGet(function() {
                changed = true;
            });
            expect(removed).toBe(true);
            expect(changed).toBe(true);
        });

    });

})();

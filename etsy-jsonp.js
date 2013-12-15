(function() {
	'use strict';
	var jsonpID = 0,
		API_URL = 'https://openapi.etsy.com/v2/';

	/***
	 * JSONP Client for Etsy. GET is the only function supported by JSONP
	 * @param options object
	 * {
	 *   apiKey string (mandatory)
	 *   apiUrl string (optional)
	 * }
	 * @constructor
	 */
	function EtsyJsonp(options) {
		if (!options.apiKey) {
			throw new Error('apiKey is required');
		}
		this._apiKey = options.apiKey;
		if (options.apiUrl) {
			this._apiUrl = options.apiUrl;
		} else {
			this._apiUrl = API_URL;
		}
	}

	EtsyJsonp.prototype = {
		/**
		 * Get call to the Etsy API.
		 * @param options object
		 * {
		 *   path: string Path based on API i.e /listings/:listing_id (listing_id will be replaced correctly)
		 *   params: object Url params specified by docs
		 *   callbackName: string custom jsonp callback name
		 *   disableCaching: bool By default no requests are cached, set true to disable cache busting
		 *   success: function Function called when the request was successful
		 *   error: function Function called when the request fails
		 *   done: function Function called when the request is done (success or fail)
		 * }
		 */
		get: function(options) {
			return this._requestJsonp(options);
		},
		/***
		 * Internal request function used by get, not to be called outsit
		 * @param options object
		 * {
		 *   path: string Path based on API i.e /listings/:listing_id (listing_id will be replaced correctly)
		 *   params: object Url params specified by docs
		 *   callbackName: string custom jsonp callback name
		 *   disableCaching: bool By default no requests are cached, set true to disable cache busting
		 *   success: function Function called when the request was successful
		 *   error: function Function called when the request fails
		 *   done: function Function called when the request is done (success or fail)
		 * }
		 * @private
		 */
		_requestJsonp: function _request(options) {
			var callbackName = options.callbackName || 'etsyJsonp' + (++jsonpID),
				script = document.createElement('script'),
				originalCallback = window[callbackName],
				abortTimeout,
				responseData,
				self = this;

			// Function gets called on error and on success
			var onScript = function(e, errorType) {
				clearTimeout(abortTimeout);
				self._removeScriptEvents(script, onScript);
				script.parentNode.removeChild(script);

				var error = null;
				if (e.type === 'error') {
					error = 'error';
				}

				self._executeCallbacks(responseData, errorType || error, options);

				window[callbackName] = originalCallback;
				if (responseData && typeof originalCallback === 'function') {
					originalCallback(responseData);
				}

				originalCallback = responseData = undefined;
			};

			// Based on browser support, attach the event accordingly
			this._addScriptEvents(script, onScript);

			// Attach the callback to the window so the script can access it
			window[callbackName] = function() {
				responseData = arguments[0];
			};

			// Remove the leading slash, so we don't have double slashes
			var path = options.path.replace(/^\//, '');

			// If the path does not end in .js, add it to the end
			if (!path.match(/\.js$/i)) {
				path += '.js';
			}

			// Copy the params, so we don't modify the original
			// This is a shallow copy. Might need to change in the future
			var params = {};
			if (options.params) {
				for (var key in options.params) {
					if (options.params.hasOwnProperty(key)) {
						params[key] = options.params[key];
					}
				}
			}

			// Replace all the params in the path i.e. :user_id
			var pathParams = path.match(/:[a-zA-Z_]+/g);
			if (pathParams) {
				for (var i = 0; i < pathParams.length; i++) {
					var paramName = pathParams[i].replace(/^:/, '');
					var value = params[paramName];
					delete params[paramName];
					path = path.replace(new RegExp(pathParams[i], 'gi'), value);
				}
			}

			params['api_key'] = this._apiKey;
			params.callback = callbackName;

			// Random string to disable caching
			if (options.disableCaching !== true) {
				params.___ = this._createRandomString(10);
			}

			// Create the script URL
			script.src = this._apiUrl + path + this._objectToQueryString(params);

			// Based on browser support, attach to the correct element
			(document.head || document.documentElement).appendChild(script);

            abortTimeout = setTimeout(function() {
                onScript({ type: 'error'}, 'timeout');
            }, options.timeout || 5000);

			return {
				abort: function abort() {
					onScript({ type: 'error'}, 'Request Aborted');
				}
			};
		},
		/**
		 * Call the correct callbacks based on a response
		 * @param response anything
		 * @param error string
		 * @param options object
		 * {
		 *   success: function called when the call was successful
		 *   error: function called when the call returned an error or is empty
		 *   done: function called when the request finishes
		 * }
		 * @private
		 */
		_executeCallbacks: function _executeCallbacks(response, error, options) {
			if (typeof response === 'object' && response.ok === true) {
				if (typeof options.success === 'function') {
					options.success({
						response: response
					});
				}
			} else {
				if (typeof options.error === 'function') {
					var prettyError = '';
					if (typeof response === 'object' && response.error) {
						prettyError = response.error;
					} else {
						prettyError = error == null ? 'Unknown error' : error;
					}
					options.error({
						error: prettyError
					});
				}
			}
			if (typeof options.done === 'function') {
				options.done();
			}
		},
		/**
		 * Turn an object into a query string
		 * @param obj
		 * @returns {string}
		 * @private
		 */
		_objectToQueryString: function _objectToQueryString(obj) {
			var queryParts = [];
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					var val = obj[key];
					var part = encodeURIComponent(key);
					if (val || val === 0) {
						part += '=' + encodeURIComponent(val);
					}
					queryParts.push(part);
				}
			}

			return '?' + queryParts.join('&');
		},
		/***
		 * Create a random string of any length
		 * @param length
		 * @returns {string}
		 * @private
		 */
		_createRandomString: function _createRandomString(length) {
			var text = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

			for (var i = 0; i < length; i++)
				text += possible.charAt(Math.floor(Math.random() * possible.length));

			return text;
		},
		_addScriptEvents: function _addScriptEvents(script, callback) {
			if (script.addEventListener) {
				script.addEventListener('load', callback);
				script.addEventListener('error', callback);
			} else if (script.detachEvent) {
				script.attachEvent('load', callback);
				script.attachEvent('error', callback);
			} else {
				script.onload = callback;
				script.onerror = callback;
			}
		},
		_removeScriptEvents: function _removeScriptEvents(script, callback) {
			if (script.removeEventListener) {
				script.removeEventListener('load', callback);
				script.removeEventListener('error', callback);
			} else if (script.detachEvent) {
				script.detachEvent('load', callback);
				script.detachEvent('error', callback);
			} else {
				script.onload = undefined;
				script.onerror = undefined;
			}
		}
	};

	// If the user is using require, define the module
	if (typeof define === 'function' && define.amd) {
		define(EtsyJsonp);
	} else {
		window['EtsyJsonp'] = EtsyJsonp;
	}
})();
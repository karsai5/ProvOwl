(function() {
	/*jshint unused:false*/
	"use strict";

	window.Warnings = (function() {
		var instance;

		var warnings = function() {
			var div;
			var shown = true;
			var wrapper;

			this.setDiv = function(warningDiv) {
				div = $(warningDiv);
				wrapper = $('.warnings_wrapper');
			};

			this.togglePanel = function() {
				if (wrapper.css('display') === 'none') {
					wrapper.css('display', 'block');
				} else {
					wrapper.css('display', 'none');
				}
			};

			this.add = function(type, details) {
				div.append('<p><strong>' + type + ':</strong> ' + details + '</p>');
			};
		};

		function createInstance() {
			var w = new warnings();
			return w;
		}

		return {
			getInstance: function() {
				if (!instance) {
					instance = createInstance();
				}
				return instance;
			}
		};
	})();

}());

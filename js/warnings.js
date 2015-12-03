(function() {
  /*jshint unused:false*/
  "use strict";

  window.Warnings = (function() {
    var instance;

    var warnings = function() {
      var div;
      var shown = false;

      this.setDiv = function(warningDiv) {
        div = $(warningDiv);
        div.html('<p><strong>Warnings</strong></p>');
      };

      this.show = function () {
        shown = true;
        console.log(div.height());
        div.css('position', 'relative');
        div.css('top', div.outerHeight());
        div.show();
        div.animate({ top: 0}, 500 );
      };

      this.add = function(type, details) {
        div.append('<p><strong>' + type + ':</strong> ' + details + '</p>');
        if (!shown) {
          this.show();
        }
      };
    };

    function createInstance() {
      var w  = new warnings();
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

}())

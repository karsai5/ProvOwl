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
        div.html('<p><strong>Warnings</strong> <a href="#" onclick="w1.hide()">[close]</a></p>');
      };

      this.show = function() {
        if (!shown) {
          shown = true;
          div.css('position', 'relative');
          div.css('top', div.outerHeight());
          div.show();
          div.animate({ top: 0}, 500 );
        }
      };

      this.hide = function() {
        if (shown) {
          shown = false;
          div.animate({top: div.outerHeight()}, 500 , function showDiv() {
                div.hide();
              });
        }
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

}());

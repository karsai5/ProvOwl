(function() {
  /*jshint unused:false*/
  "use strict";

  window.Warnings = (function() {
    var instance;

    var warnings = function() {
      var div;
      var shown = true;

      this.setDiv = function(warningDiv) {
        div = $(warningDiv);
        div.html('<p class="warnings-header">Warnings <a href="#" onclick="w1.toggle()">show</a></p>');
        div.css('position', 'relative');
        this.hide();
        div.show();
      };

      this.toggle = function() {
        if (shown) {
          this.hide();
        } else {
          this.show();
        }
      };

      this.show = function(offset) {
        if (offset === undefined) {
          offset = 0;
        }
        if (!shown) {
          shown = true;
          div.animate({ top: 0}, 500 );
          div.find('a').text('hide');
        }
      };

      this.hide = function() {
        if (shown) {
          shown = false;
          div.animate({top: div.outerHeight() - 80}, 500);
          div.find('a').text('show');
        }
      };

      this.add = function(type, details) {
        div.append('<p><strong>' + type + ':</strong> ' + details + '</p>');
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

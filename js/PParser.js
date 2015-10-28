(function() {
  /*jshint unused:false*/
  "use strict";

  window.PParser = function() {

    this.parse = function(file) {
      $.get (file, function(data) {
        console.log(data);
      });
    };
  };
}());

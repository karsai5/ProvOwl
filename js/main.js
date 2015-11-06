(function() {
  /*jshint unused:false*/
  /* globals PParser */
  "use strict";
  $( document ).ready(function() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      console.log("File API's supported");
    } else {
      alert('The File APIs are not fully supported in this browser.');
    }

    var parser = new PParser();
    window.fileSelector = $('<input type="file" />');
    window.fileSelector.on('change', function(event) {
      var f = event.target.files[0];
      var reader = new FileReader();

      reader.onload = function(theFile) {
        var contents = theFile.target.result;
        console.log(contents);
        parser.parseString(contents,
            function(p2) {
              p2.render('svg g');
            });
      };
      reader.readAsText(f);
    });
    window.selectFile = function() {
      window.fileSelector.click();
      return false;
    };
  });
}());


(function() {
  /*jshint unused:false*/
  "use strict";
  $( document ).ready(function() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      // Great success! All the File APIs are supported.
    } else {
      alert('The File APIs are not fully supported in this browser.');
    }
    window.fileSelector = $('<input type="file" />');
    window.fileSelector.on('change', function(event) {
      var f = event.target.files[0];
      var reader = new FileReader();

      reader.onload = function(theFile) {
        var contents = theFile.target.result;
        console.log(contents);
      };
      reader.readAsText(f);
    });
    window.selectFile = function() {
      window.fileSelector.click();
      return false;
    };
  });
}());


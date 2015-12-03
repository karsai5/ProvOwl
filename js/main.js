(function() {
  /*jshint unused:false*/
  /* globals PParser */
  "use strict";

  function checkForFileReaderSupport() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      console.log("File API's supported");
      return true;
    } else {
      $('body').html("The Files APIs are not fully supported in this browser. Try using a newer browser");
      return false;
    }
  };

  function loadFile(event) {
    $("#cy").html("");
    $("#file_info").html("");
    var parser = new PParser();
    var f = event.target.files[0];
    var reader = new FileReader();

    reader.onload = function(theFile) {
      var fileName = $(fileSelector[0].value.split('\\')).last()[0];
      var contents = theFile.target.result;
      var lineCount = contents.length;
      w1.setDiv("#warnings");
      parser.parseString(contents,
          function(p2) {
            window.p2 = p2;
            p2.render('#cy', function() {
              $("#file_info").append("<strong>Name:</strong> " + fileName);
              $("#file_info").append("<br><strong>Download:</strong>" + 
                  " <a target=\"_blank\" href=\"" + 
                  window.cy.png({full: true}) + 
                  "\">graph png</a>");
            });
          });
    };
    reader.readAsText(f);
  };

  $( document ).ready(function() {

    // Check file reader support is enabled
    if(checkForFileReaderSupport()) {
      // create a sudo file selector and use that for selecting files
      window.fileSelector = $('<input type="file" />');
      window.fileSelector.on('change', loadFile);
      window.selectFile = function() {
        window.fileSelector.click();
        return false;
      };

      window.w1 = Warnings.getInstance();  
    }

  });
}());


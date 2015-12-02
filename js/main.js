(function() {
  /*jshint unused:false*/
  /* globals PParser */
  "use strict";

  function resizeDiv() {
    $("#cy").height($(window).height());
  };

  function checkForFileReaderSupport() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      console.log("File API's supported");
    } else {
      $('body').html("The Files APIs are not fully supported in this browser. Try using a newer browser");
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
        parser.parseString(contents,
            function(p2) {
              window.p2 = p2;
              p2.render('#cy');
              $("#file_info").append("<strong>Name:</strong> " + fileName);
              $("#file_info").append("<strong>Wordcount:</strong> " + lineCount);
            });
      };
      reader.readAsText(f);
  };

  $( document ).ready(function() {

    checkForFileReaderSupport();
    resizeDiv();

    $(window).resize(resizeDiv);

    window.fileSelector = $('<input type="file" />');
    window.fileSelector.on('change', loadFile);

    window.selectFile = function() {
      window.fileSelector.click();
      return false;
    };
  });
}());


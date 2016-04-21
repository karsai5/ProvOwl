/**
 * @fileOverview This is the main javascript file for the provowl application.
 * jshint unused:false
 * globals PParser, fileSelector, w1, Warnings 
 */

"use strict";

/**
 * Check for file reader support http://caniuse.com/#feat=filereader
 * If no luck it replaces the website with text asking the user to try
 * a newer web browser
 *
 */
function checkForFileReaderSupport() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        console.log("File API's supported");
        return true;
    } else {
        $('body').html("The Files APIs are not fully supported in this browser. Try using a newer browser");
        return false;
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * Load a file from the file picker. Create a provenance parser and from that
 * create a provenance visualiser.
 * @param {event} event File picker bound change event
 */
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
        var p2 = parser.parseString(contents);
        window.p2 = p2;
        p2.render('#cy', function() {
            $("#file_info").append("<strong>Name:</strong> " + fileName);
            $("#provSelectButton").parent().remove();
        });
    };
    reader.readAsText(f);
}

function loadWebFile(url) {
    $("#cy").html("");
    $("#file_info").html("");
    var parser = new PParser();
    var reader = new FileReader();
    var p2 = null;
    w1.setDiv("#warnings");

    parser.parseFile(url, function(provObject) {
        p2 = provObject;
        p2.render('#cy', function() {
            $("#file_info").append("<strong>Name:</strong> " + url);
            $("#provSelectButton").parent().remove();
        });
    });
}

/**
 * Set up fileselector so that the provenance file will be loaded and
 * rendered client side.
 */
$(document).ready(function() {

    // Check file reader support is enabled
    if (checkForFileReaderSupport()) {
        // create a sudo file selector and use that for selecting files
        window.fileSelector = $('<input type="file" />');
        window.fileSelector.on('change', loadFile);
        window.selectFile = function() {
            window.fileSelector.click();
            return false;
        };

        window.w1 = Warnings.getInstance();
        // check if file is supplied in url, if so load it.
        var fileurl = getParameterByName('file');
        if (fileurl !== null) {
            console.log("loading file from url");
            loadWebFile(fileurl);
        }
    }

});
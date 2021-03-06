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
		$('body').html(
			"The Files APIs are not fully supported in this browser. Try using a newer browser"
		);
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
		p2.render({
			inner: '#cy',
			callback: function() {
				$("#provSelectButton").parent().remove();
			}
		});
	};
	reader.readAsText(f);
}

function loadWebFile(url) {
	return new Promise(function(resolve, reject) {
		$("#cy").html("");
		$("#file_info").html("");
		var parser = new PParser();
		var reader = new FileReader();
		var p2 = null;
		w1.setDiv("#warnings");

		parser.parseFile(url, function(provObject) {
			p2 = provObject;
			p2.render({
				inner: '#cy',
				callback: function() {
					$("#file_info").append("<strong>Name:</strong> " + url);
					$("#provSelectButton").parent().remove();
					resolve();
				}
			});
		});
	});
}

function loadJson(json) {
	$("#cy").html("");
	$("#file_info").html("");
	var parser = new PParser();
	var reader = new FileReader();
	var p2 = null;
	w1.setDiv("#warnings");

	p2 = new PVisualiser;
	p2.renderJson('#cy', json);
}

function connectFilterPanel() {
	var regexInput = $("#regex-input");
	var groupButton = $("#regex-group");

	regexInput.on('input', function() {
		if (regexInput.val() === "") {
			cy.$('node').removeClass('selected'); // get all nodes
		} else {
			pvis.regexSelect(regexInput.val());
		}
	});

	regexInput.keydown(function(e) {
		if (e.keyCode == 13) {
			pvis.clicks.add(new Click({
				desc: "Grouped with simple filter",
				event: event,
				elementId: regexInput.val()
			}));
			pvis.regexGroup(regexInput.val());
		}
	});

	groupButton.on('click', function() {
		if (regexInput.val() !== "") {
			pvis.clicks.add(new Click({
				desc: "Grouped with simple filter",
				elementId: regexInput.val()
			}));
			pvis.regexGroup(regexInput.val());
		}
	});
}

function infoPannels() {
	var floating_panels = $(".floating_info");

	// make draggable
	floating_panels.draggable({
		containment: 'document',
		handle: '.header'
	});

	// make resizeable
	floating_panels.resizable({
		handles: "se"
	});

	// close on cross click
	floating_panels.find('.close').on('click', function() {
		$(this).parents('.floating_info').hide();
	});
}


function addExtraClickBindings() {
	$(".floating_info a").bind('click', function() {
		console.log('floating panel link clicked');
		return true;
	}, false);
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
		connectFilterPanel(); // code for simple filter
		infoPannels(); // floating panels settings
		addExtraClickBindings(); // click tracker
		var filePromise = new Promise(function(resolve) {
			resolve();
		});
		if (fileurl !== null) {
			filePromise = loadWebFile(fileurl);
		}
		// load commands if they're in url
		var commandurl = getParameterByName('commands');
		if (commandurl !== null) {
			filePromise.then(function() {
				console.log('Loading commands.');
				$.getScript(commandurl);
				// reset layout
				setTimeout(function() {
					// pvis.resetLayout('dagre');
				}, 1000);
			});
		}
	}

});

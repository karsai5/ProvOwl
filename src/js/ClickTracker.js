"use strict";

function ClickTracker() {
	this.clicks = [];
	this.x = $(document).width();
	this.y = $(document).height();
}

ClickTracker.prototype.add = function(click) {
	this.clicks.push(click);
};

ClickTracker.prototype.downloadCSV = function() {
	var csvContent = "data:text/tsv;charset=utf-8,";
	this.getClicks().forEach(function(c, i) {
		var dataString = c.join("\t");
		csvContent += dataString + "\n";
	});

	var downloadLink = document.createElement("a");
	downloadLink.href = csvContent;
	downloadLink.download = "clickdata.tsv";
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
};

ClickTracker.prototype.getClicks = function() {
	var results = [];
	results.push(["Timestamp", "Desc", "Element", "X Position", "Y Position"]);
	for (var i = 0; i < this.clicks.length; i++) {
		var c = this.clicks[i];
		results.push([c.timestamp.getTime(), c.desc, c.elementId, c.x, c.y]);
	}
	return results;
};

function Click(params) {
	this.desc = params.desc;
	this.event = params.event;
	if (params.event !== undefined && params.event.cyTarget !== undefined) {
		this.element = params.event.cyTarget;
	} else {
		this.element = undefined;
	}
	if (params.elementId === undefined && this.element !== undefined && this.element
		.id !== undefined) {
		this.elementId = this.element.id();
	} else {
		this.elementId = params.elementId;
	}
	this.timestamp = new Date();
	try {
		this.x = params.event.originalEvent.pageX;
		this.y = params.event.originalEvent.pageY;
	} catch (err) {
		this.x = undefined;
		this.y = undefined;
	}
}

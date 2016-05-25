"use strict";

function ClickTracker() {
	this.clicks = [];
}

ClickTracker.prototype.add = function(click) {
	this.clicks.push(click);
};

function Click(params) {
	this.desc = params.desc;
	this.element = params.desc;
	this.event = params.event;
	this.timestamp = new Date();
}

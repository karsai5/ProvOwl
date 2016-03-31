/**
 * @fileOverview Contains the VisHistory class used for tracking users actions
 * so that they can be undone and redone.
 * jshint unused:false
 * jshint freeze:false
 * global w1
 */
"use strict";

/**
 * Visualisation history parser
 * @constructor
 */
function VisHistory() {
  this.currentStep = new Step(function() {}, function() {});
  this.currentStep.name = "Beginning";
};

VisHistory.prototype.undo = function() {
  console.log("Undo: " + this.currentStep.name);
  var oldCurrentStep = this.currentStep;
  this.currentStep.undo();
  if (this.currentStep.past !== null) {
    this.currentStep = this.currentStep.past;
  }
}

VisHistory.prototype.redo = function() {
  if (this.currentStep.future !== null) {
    console.log("Redo: " + this.currentStep.future.name);
    this.currentStep.future.redo();
    this.currentStep = this.currentStep.future;
  }
}

VisHistory.prototype.addStep = function(step) {
  step.past = this.currentStep;
  this.currentStep.future = step;
  this.currentStep = step;
}

VisHistory.prototype.help = function() {
  console.log(
    "This class is used to keep track of the history of users actions so that they can be undone and redone."
  );
};

/**
 * A step represents a single action a user can undo/redo.
 */
function Step(name, undo, redo, runStepNow) {
  this.future = null;
  this.past = null;
  this.undo = undo;
  this.redo = redo;
  this.name = name;

  if (runStepNow === true) {
    this.redo();
  }
}

var v = new VisHistory();
var s1 = new Step(
  function() {
    console.log("undoing step 1");
  },
  function() {
    console.log("re-doing step 1");
  },
  false);
s1.name = "step1";
var s2 = new Step(
  function() {
    console.log("undoing step 2");
  },
  function() {
    console.log("re-doing step 2");
  },
  false);
s2.name = "step2";
var s3 = new Step(
  function() {
    console.log("undoing step 3");
  },
  function() {
    console.log("re-doing step 3");
  },
  false);
s3.name = "step3";
v.addStep(s1);
v.addStep(s2);

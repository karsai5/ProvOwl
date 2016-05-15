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
    this.printHistory();
}

VisHistory.prototype.redo = function() {
    if (this.currentStep.future !== null) {
        console.log("Redo: " + this.currentStep.future.name);
        this.currentStep.future.redo();
        this.currentStep = this.currentStep.future;
    }
    this.printHistory();
}

VisHistory.prototype.addStep = function(step) {
    step.past = this.currentStep;
    this.currentStep.future = step;
    this.currentStep = step;
    this.printHistory();
}

VisHistory.prototype.help = function() {
    console.log(
        "This class is used to keep track of the history of users actions so that they can be undone and redone."
    );
};

VisHistory.prototype.printHistory = function(div) {
    var outputString = "<strong>" + this.currentStep.name + "</strong>";

    // get future history
    if (this.currentStep.future) {
        var nextStep = this.currentStep.future;
        do {
            outputString = nextStep.name + "<br>" + outputString;
        } while (nextStep = nextStep.future)
    }

    // get past history
    if (this.currentStep.past) {
        var pastStep = this.currentStep.past;
        do {
            outputString = outputString + "<br>" + pastStep.name;
        } while (pastStep = pastStep.past)
    }

    $("#history_info").html(outputString);
}

VisHistory.prototype.togglePanel = function() {
    var history_panel = $(".history_wrapper");
    if (history_panel.css('display') === 'block') {
        history_panel.css('display', 'none');
    } else {
        history_panel.css('display', 'block');
    }
}

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

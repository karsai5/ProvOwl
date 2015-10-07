var PVisualiser = function(inner) {
  console.log('Provenance visualiser initialised.');
  this.inner = d3.select(inner);
  this.g = new dagre.graphlib.Graph();
  this.g.setGraph({});
  this.g.setDefaultEdgeLabel(function() { return {}; });
  this.g.graph().marginx = 20;
  this.g.graph().marginy = 20;

  this.createEntity = function(name, label) {
    this.g.setNode(name, {shape: 'ellipse', class: 'entity', label: label});
  };

  this.createActivity = function(name, label) {
    this.g.setNode(name, {class: 'activity', label: label});
  };

  this.generated = function (name1, name2) {
    this.g.setEdge(name1, name2, {label: 'gen'});
  };

  this.used = function (name1, name2) {
    this.g.setEdge(name1, name2, {label: 'use'});
  };

  this.render = function() {
    var render = dagreD3.render();
    this.inner.call(render, this.g);
  };

};

$(document).ready(function() {
  var p = new PVisualiser('svg g');
  p.createEntity('ajcsummary', 'AJC-summary');
  p.createEntity('advicereports', 'Advice Reports');
  p.createEntity('report1', 'Report 1');
  p.createEntity('report2', 'Report 2');
  p.createActivity('abs', 'ABS');
  p.createActivity('analytics', 'Analytics');

  p.generated('report1', 'analytics');
  p.generated('advicereports', 'abs');

  p.used('analytics', 'ajcsummary');
  p.used('report2', 'abs');
  p.used('abs', 'report1');
  p.used('abs', 'report2');

  p.render();
});



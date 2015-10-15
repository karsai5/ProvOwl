var PVisualiser = function(inner) {
  console.log('Provenance visualiser initialised.');
  this.inner = d3.select(inner);
  this.g = new dagre.graphlib.Graph();
  this.g.setGraph({});
  this.g.setDefaultEdgeLabel(function() { return {}; });
  this.g.graph().marginx = 20;
  this.g.graph().marginy = 20;

  this.createEntity = function(name, label) {
    if (typeof name !== 'string' || typeof label !== 'string') {
      throw new Error("Can't create entity: Unexpected Variables");
    }
    this.g.setNode(name, {shape: 'ellipse', class: 'entity', label: label});
    return true;
  };

  this.createActivity = function(name, label) {
    if (typeof name !== 'string' || typeof label !== 'string') {
      throw new Error("Can't create activity: Unexpected Variables");
    }
    this.g.setNode(name, {class: 'activity', label: label});
    return true;
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

  this.getGraph = function () {
    return this.g;
  };

};

$(document).ready(function() {
  var p = new PVisualiser('svg g');
  p.createEntity(1, 'AJC-summary');
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



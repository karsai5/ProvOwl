(function() {
  /*jshint unused:false*/
  "use strict";

  window.PVisualiser = function(inner) {
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
      var result = this.g.setNode(name, {shape: 'ellipse', class: 'entity', label: label});
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
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        throw new Error("Can't create generation: Unexpected Variables");
      }

      // Check nodes exist
      var name1bool = false;
      var name2bool = false;
      this.g.nodes().some(function(entry) {
        if (entry === name1) {
          name1bool = true;
        } else if (entry === name2) {
          name2bool = true;
        }
        if( name1bool === true && name2bool === true) {
          return true;
        }
      });

      if (name1bool === false || name2bool === false) {
        throw new Error("Can't create generation: Nonexistent node refereced");
      }

      this.g.setEdge(name1, name2, {label: 'gen'});
      return true;
    };

    this.used = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        throw new Error("Can't create use edge: Unexpected Variables");
      }

      // Check nodes exist
      var name1bool = false;
      var name2bool = false;
      this.g.nodes().some(function(entry) {
        if (entry === name1) {
          name1bool = true;
        } else if (entry === name2) {
          name2bool = true;
        }
        if( name1bool === true && name2bool === true) {
          return true;
        }
      });

      if (name1bool === false || name2bool === false) {
        throw new Error("Can't create use edge: Nonexistent node refereced");
      }

      this.g.setEdge(name1, name2, {label: 'use'});
      return true;
    };

    this.render = function() {
      var render = dagreD3.render();
      this.inner.call(render, this.g);
    };

    this.getGraph = function () {
      return this.g;
    };

  };
}());

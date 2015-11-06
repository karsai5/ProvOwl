(function() {
  /*jshint unused:false*/
  /* globals cytoscape */
  "use strict";

  window.PVisualiser = function() {
    console.log('Provenance visualiser initialised.');
    this.nodes = [];
    this.edges = [];

    this.createEntity = function(name, label) {
      if (typeof name !== 'string' || typeof label !== 'string') {
        throw new Error("Can't create entity: Unexpected Variables");
      }
      this.nodes.push({ data: { id: name, name: label, weight: 65, faveColor: '#6FB1FC', faveShape: 'triangle' } });
      return true;
    };

    this.createActivity = function(name, label) {
      if (typeof name !== 'string' || typeof label !== 'string') {
        throw new Error("Can't create activity: Unexpected Variables");
      }
      return true;
    };

    this.generated = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        throw new Error("Can't create generation: Unexpected Variables");
      }

      var name1bool = true;
      var name2bool = true;
      if (name1bool === false || name2bool === false) {
        throw new Error("Can't create generation: Nonexistent node refereced");
      }

      return true;
    };

    this.used = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        throw new Error("Can't create use edge: Unexpected Variables");
      }

      var name1bool = true;
      var name2bool = true;
      if (name1bool === false || name2bool === false) {
        throw new Error("Can't create use edge: Nonexistent node refereced");
      }

      return true;
    };

    this.render = function(inner) {
      if (typeof inner !== 'string') {
        throw new Error("Can't render graph: Unexpected Variables");
      }
      $(inner).cytoscape({
        layout: {
          name: 'cose',
          padding: 10
        },
        style: cytoscape.stylesheet()
          .selector('node')
          .css({
            'shape': 'data(faveShape)',
            'width': 'mapData(weight, 40, 80, 20, 60)',
            'content': 'data(name)',
            'text-valign': 'center',
            'text-outline-width': 2,
            'text-outline-color': 'data(faveColor)',
            'color': '#fff'
          })
        .selector(':selected')
          .css({
            'border-width': 3,
            'border-color': '#333'
          })
        .selector('edge')
          .css({
            'opacity': 0.666,
            'width': 'mapData(strength, 70, 100, 2, 6)',
            'target-arrow-shape': 'triangle',
            'source-arrow-shape': 'circle',
            'line-color': 'data(faveColor)',
            'source-arrow-color': 'data(faveColor)',
            'target-arrow-color': 'data(faveColor)'
          })
        .selector('edge.questionable')
          .css({
            'line-style': 'dotted',
            'target-arrow-shape': 'diamond'
          })
        .selector('.faded')
          .css({
            'opacity': 0.25,
            'text-opacity': 0
          }),
        elements: {
          nodes: this.nodes,
          edges: this.edges
        },

        ready: function(){
          window.cy = this;

          // giddy up
        }
      });
    };

    this.getGraph = function () {
      return true;
    };

  };
}());

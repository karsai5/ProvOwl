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
      this.nodes.push({ data: { id: name, name: label, weight: 65, faveColor: '#6FB1FC', faveShape: 'triangle' } });
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
      this.inner = inner;
      var that = this;
      $.get('/css/cytoscape.css', function (data) {
        $(that.inner).cytoscape({
          layout: {
            name: 'cose',
            padding: 10
          },
          style: data,
          elements: {
            nodes: that.nodes,
            edges: that.edges
          },

          ready: function(){
            window.cy = that;

            // giddy up
          }
        });
      });
    };

    this.getGraph = function () {
      return true;
    };

  };
}());

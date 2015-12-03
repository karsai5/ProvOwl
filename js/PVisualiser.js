(function() {
  /*jshint unused:false*/
  "use strict";

  window.PVisualiser = function() {
    console.log('Provenance visualiser initialised.');
    this.nodes = [];
    this.edges = [];

    this.nodeExists = function(name) {
      var found = false;
      $.each(this.nodes, function() {
        if (name === this['data']['id']) {
          found = true;
          return;
        }
      });
      return found;
    }

    this.createEntity = function(name, label) {
      if (typeof name !== 'string' || typeof label !== 'string') {
        throw new Error("Can't create entity: Unexpected Variables");
      }
      if (this.nodeExists(name)) {
        throw new Error("Can't create entity: ID already exists");
      }
      this.nodes.push({ data: { id: name, name: label, weight: 65, faveColor: '#6FB1FC', faveShape: 'triangle'}, classes: 'entity' });
      return true;
    };

    this.createAgent = function(name, label) {
      if (typeof name !== 'string' || typeof label !== 'string') {
        throw new Error("Can't create entity: Unexpected Variables");
      }
      if (this.nodeExists(name)) {
        throw new Error("Can't create entity: ID already exists");
      }
      this.nodes.push({ data: { id: name, name: label, weight: 65, faveColor: '#6FB1FC', faveShape: 'triangle'}, classes: 'agent' });
      return true;
    };

    this.createActivity = function(name, label) {
      if (typeof name !== 'string' || typeof label !== 'string') {
        throw new Error("Can't create activity: Unexpected Variables");
      }
      if (this.nodeExists(name)) {
        console.log(name);
        throw new Error("Can't create activity: ID already exists");
      }
      this.nodes.push({ data: { id: name, name: label, weight: 65, faveColor: '#6FB1FC', faveShape: 'triangle' }, classes: 'activity'});
      return true;
    };

    this.wasAttributedTo = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        throw new Error("Can't create attribute: Unexpected Variables");
      }

      var name1bool = this.nodeExists(name1);
      var name2bool = this.nodeExists(name2);
      if (name1bool === false) {
        console.warn("Can't find node: " + name1);
      }
      if (name2bool === false) {
        console.warn("Can't find node: " + name2);
      }
      if (name1bool === false || name2bool === false) {
        throw new Error("Can't create attribute: Nonexistent node refereced");
      }
      this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, label: 'wasAttributedTo'}, classes: "attributed"});

      return true;
    };

    this.wasGeneratedBy = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        throw new Error("Can't create generation: Unexpected Variables");
      }

      var name1bool = this.nodeExists(name1);
      var name2bool = this.nodeExists(name2);
      if (name1bool === false) {
        console.warn("Can't find node: " + name1);
      }
      if (name2bool === false) {
        console.warn("Can't find node: " + name2);
      }
      if (name1bool === false || name2bool === false) {
        throw new Error("Can't create generation: Nonexistent node refereced");
      }
      this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, label: 'generated'}, classes: "generated"});

      return true;
    };

    this.wasAssociatedWith = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        throw new Error("Can't create generation: Unexpected Variables");
      }

      var name1bool = this.nodeExists(name1);
      var name2bool = this.nodeExists(name2);
      if (name1bool === false) {
        console.warn("Can't find node: " + name1);
      }
      if (name2bool === false) {
        console.warn("Can't find node: " + name2);
      }
      if (name1bool === false || name2bool === false) {
        throw new Error("Can't create association: Nonexistent node referenced");
      }
      this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, label: 'wasAssociatedWith'}, classes: "associated"});

      return true;
    };

    this.used = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        throw new Error("Can't create use edge: Unexpected Variables");
      }

      var name1bool = this.nodeExists(name1);
      var name2bool = this.nodeExists(name2);
      if (name1bool === false || name2bool === false) {
        throw new Error("Can't create use edge: Nonexistent node refereced");
      }
      this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, label: 'used'}, classes: "used"});

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
            name: 'dagre',
            padding: 150
          },
          style: data,
          elements: {
            nodes: that.nodes,
            edges: that.edges
          },

          ready: function(){
            window.cy = that;
          }
        });
      });
    };

    this.nodeCount = function() {
      return this.nodes.length;
    }

    this.edgeCount = function() {
      return this.edges.length;
    }

  };
}());

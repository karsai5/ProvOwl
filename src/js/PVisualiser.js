(function() {
  /* jshint unused:false */
  /* globals w1 */
  "use strict";

  window.PVisualiser = function() {
    console.log('Provenance visualiser initialised.');
    this.nodes = [];
    this.edges = [];

    // Print to user log using window.w1, if that undefined
    // use the console instead
    var print = function(msg) {
      if (typeof w1 === 'undefined') {
        console.warn(msg);
      } else {
        w1.add(msg);
      }
    };

    var logUnexpectedVariables = function(what) {
      print("Can't create " + what + ": unexpected variables");
    };

    var logDuplicate = function (what, name) {
      print("Can't create duplicate " + what + "\"" + name + "\" already exists");
    };

    var logMissingNode = function (what, name) {
      print("Can't create " + what + "\"" + name + "\" doesn't exist");
    };

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

    this.addNode = function(name, label, type) {
      if (typeof name !== 'string' || typeof label !== 'string') {
        logUnexpectedVariables(type);
      } else if (this.nodeExists(name)) {
        logDuplicate(type, name);
      } else {
        this.nodes.push({ data: { id: name, name: label}, 
          classes: 'entity' });
        return true;
      }
      return false;
    };

    // @name1: first node
    // @name2: second node
    // @type: desc of type eg. derived
    // @label: label to be applied eg. wasDerivedFrom
    this.addEdge = function(name1, name2, type, label) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        logUnexpectedVariables(type + ' edge');
      } else if (!this.nodeExists(name1)) {
        logMissingNode(type + ' edge', name1);
      } else if (!this.nodeExists(name2)) {
        logMissingNode(type + ' edge', name2);
      } else {
        this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, 
          label: label}, classes: type});
        return true;
      }
      return false;
    };

    this.createEntity = function(name, label) {
      return this.addNode(name, label, 'entity');
    };

    this.createAgent = function(name, label) {
      return this.addNode(name, label, 'agent');
    };

    this.createActivity = function(name, label) {
      return this.addNode(name, label, 'activity');
    };

    this.wasDerivedFrom = function (name1, name2) {
      return this.addEdge(name1, name2, 'derived', 'wasDerivedFrom');
    };

    this.specialisationOf = function (name1, name2) {
      return this.addEdge(name1, name2, 'specialised', 'specialisationOf');
    };

    this.alternateOf = function (name1, name2) {
      return this.addEdge(name1, name2, 'alternate', 'alternateOf');
    };

    this.wasAttributedTo = function (name1, name2) {
      return this.addEdge(name1, name2, 'attributed', 'wasAttributedTo');
    };

    this.wasGeneratedBy = function (name1, name2) {
      return this.addEdge(name1, name2, 'generated', 'wasGeneratedBy');
    };

    this.wasAssociatedWith = function (name1, name2) {
      return this.addEdge(name1, name2, 'associated', 'wasAssociatedWith');
    };

    this.used = function (name1, name2) {
      return this.addEdge(name1, name2, 'used', 'used');
    };

    this.render = function(inner, callback) {
      if (typeof inner !== 'string') {
        throw new Error("Can't render graph: Unexpected Variables");
      }
      this.inner = inner;
      var that = this;
      $.get('/static/css/cytoscape.css', function (data) {
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
            window.cy = this;
            if (typeof callback === 'function') { 
              callback();
            }
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

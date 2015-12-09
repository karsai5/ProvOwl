(function() {
  /*jshint unused:false*/
  "use strict";

  window.PVisualiser = function() {
    console.log('Provenance visualiser initialised.');
    this.nodes = [];
    this.edges = [];

    var logUnexpectedVariables = function(what) {
      console.warn("Can't create " + what + ": unexpected variables");
    };

    var logDuplicate = function (what, name) {
      w1.add("Can't create duplicate " + what, 
          "\"" + name + "\" already exists");
    };

    var logMissingNode = function (what, name) {
      w1.add("Can't create " + what, 
          "\"" + name + "\" doesn't exist");
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

    this.createEntity = function(name, label) {
      if (typeof name !== 'string' || typeof label !== 'string') {
        logUnexpectedVariables('Entity');
      } else if (this.nodeExists(name)) {
        logDuplicate('entity', name);
      } else {
        this.nodes.push({ data: { id: name, name: label}, 
          classes: 'entity' });
      }
    };

    this.createAgent = function(name, label) {
      if (typeof name !== 'string' || typeof label !== 'string') {
        logUnexpectedVariables('Agent');
      } else if (this.nodeExists(name)) {
        logDuplicate('agent', name);
      } else {
        this.nodes.push({ data: { id: name, name: label}, 
          classes: 'agent' });
      }
    };

    this.createActivity = function(name, label) {
      if (typeof name !== 'string' || typeof label !== 'string') {
        logUnexpectedVariables('Activity');
      } else if (this.nodeExists(name)) {
        logDuplicate('activity', name);
      } else {
        this.nodes.push({ data: { id: name, name: label}, 
          classes: 'activity'});
      }
    };

    this.wasDerivedFrom = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        logUnexpectedVariables('Derived edge');
      } else if (!this.nodeExists(name1)) {
        logMissingNode('Derived edge', name1);
      } else if (!this.nodeExists(name2)) {
        logMissingNode('Derived edge', name2);
      } else {
        this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, 
          label: 'wasDerivedFrom'}, classes: "attributed"});
      }
    };

    this.specialisationOf = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        logUnexpectedVariables('Specialisation edge');
      } else if (!this.nodeExists(name1)) {
        logMissingNode('Specialisation edge', name1);
      } else if (!this.nodeExists(name2)) {
        logMissingNode('Specialistaion edge', name2);
      } else {
        this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, 
          label: 'specialisationOf'}, classes: "attributed"});
      }
    };

    this.alternateOf = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        logUnexpectedVariables('Alternate edge');
      } else if (!this.nodeExists(name1)) {
        logMissingNode('Alternate edge', name1);
      } else if (!this.nodeExists(name2)) {
        logMissingNode('Alternate edge', name2);
      } else {
        this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, 
          label: 'alternateOf'}, classes: "attributed"});
      }
    };

    this.wasAttributedTo = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        logUnexpectedVariables('Attributed edge');
      } else if (!this.nodeExists(name1)) {
        logMissingNode('Attributed edge', name1);
      } else if (!this.nodeExists(name2)) {
        logMissingNode('Attributed edge', name2);
      } else {
        this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, 
          label: 'wasAttributedTo'}, classes: "attributed"});
      }
    };

    this.wasGeneratedBy = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        logUnexpectedVariables('Generated edge');
      } else if (!this.nodeExists(name1)) {
        logMissingNode('Generated edge', name1);
      } else if (!this.nodeExists(name2)) {
        logMissingNode('Generated edge', name2);
      } else {
        this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, 
          label: 'generated'}, classes: "generated"});
      }
    };

    this.wasAssociatedWith = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        logUnexpectedVariables('Associated edge');
      } else if (!this.nodeExists(name1)) {
        logMissingNode('Assoicated edge', name1);
      } else if (!this.nodeExists(name2)) {
        logMissingNode('Associated edge', name2);
      } else {
        this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, 
          label: 'wasAssociatedWith'}, classes: "associated"});
      }
    };

    this.used = function (name1, name2) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        logUnexpectedVariables('Used edge');
      } else if (!this.nodeExists(name1)) {
        logMissingNode('Used edge', name1);
      } else if (!this.nodeExists(name2)) {
        logMissingNode('Used edge', name2);
      } else {
        this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, 
          label: 'used'}, classes: "used"});
      }
    };

    this.render = function(inner, callback) {
      if (typeof inner !== 'string') {
        throw new Error("Can't render graph: Unexpected Variables");
      }
      this.inner = inner;
      var that = this;
      $.get('/src/static/css/cytoscape.css', function (data) {
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
            callback();
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

(function() {
  /* jshint unused:false, esnext: true */
  /* globals w1, cy */
  "use strict";

  class informationString {
    constructor() {
      this.information = "";
    }
    add(c1, c2) {
      if (c2 === undefined) {
        this.information += c1 + "<br>";
      } else {
        this.information += "<b>" + c1 + "</b> " + c2 + "<br>";
      }
    }
    newline() {
      this.information += "<br>";
    }
    print() {
      return this.information;
    }
  }

  window.PVisualiser = class {
    constructor() {
      console.log('Provenance visualiser initialised.');
      this.nodes = [];
      this.edges = [];
      this.nodeGroup = [];
    }

    // Print to user log using window.w1, if that undefined
    // use the console instead
    print(msg) {
      if (typeof w1 === 'undefined') {
        console.warn(msg);
      } else {
        w1.add(msg);
      }
    }

    logUnexpectedVariables(what) {
      print("Can't create " + what + ": unexpected variables");
    }

    logDuplicate(what, name) {
      print("Can't create duplicate " + what + "\"" + name + "\" already exists");
    }

    logMissingNode(what, name) {
      print("Can't create " + what + "\"" + name + "\" doesn't exist");
    }

    clickFunction(evt) {
      console.log(this);
      var node = evt.cyTarget;
      var informationObject = new informationString();
      this.selectedNode = node;

      // Highlight node and clear old selected node
      cy.$('node').removeClass('selected');
      this.selectedNode.addClass('selected');

      // Create information string
      informationObject.add("ID", node.id());
      informationObject.add("Connected Nodes", " ");
      $.each(node.neighborhood(), function(i, e) {
        if (e.isNode()) {
          informationObject.add(" - " + e.id());
        }
      });

      this.nodeGroup.push(node);

      this.printNodeInfo(informationObject.print());
    }

    hidegroup() {
      var that = this;
      $.each(this.nodeGroup, function (i, e) {
        $.each(e.neighbourhood(), function(x, n) {
          if (n.isEdge()) {
            that.nodeGroup.push(n);
            n.remove();
          }
        });
        e.remove();
      });
    }

    showgroup() {
      $.each(this.nodeGroup, function (i, e) {
        e.restore();
      });
    }

    printNodeInfo(text) {
      // console.log(text);
      text = text.replace(/\n/g, '<br>');
      $("#node_info").html(text);
    }

    nodeExists(name) {
      var found = false;
      $.each(this.nodes, function() {
        if (name === this.data.id) {
          found = true;
          return;
        }
      });
      return found;
    }

    getNode(name) {
      var found = null;
      $.each(this.nodes, function() {
        if (name === this.data.id) {
          found = this;
          return;
        }
      });
      return found;
    }

    addNode(name, label, type) {
      if (typeof name !== 'string' || typeof label !== 'string') {
        this.logUnexpectedVariables(type);
      } else if (this.nodeExists(name)) {
        this.logDuplicate(type, name);
      } else {
        this.nodes.push({ data: { id: name, name: label, type: type}, 
          classes: type});
        return true;
      }
      return false;
    }

    // @name1: first node
    // @name2: second node
    // @type: desc of type eg. derived
    // @label: label to be applied eg. wasDerivedFrom
    addEdge(name1, name2, type, label) {
      if (typeof name1 !== 'string' || typeof name2 !== 'string') {
        this.logUnexpectedVariables(type + ' edge');
      } else if (!this.nodeExists(name1)) {
        this.logMissingNode(type + ' edge', name1);
      } else if (!this.nodeExists(name2)) {
        this.logMissingNode(type + ' edge', name2);
      } else {
        this.edges.push({data: {id: name1+'-'+name2, source: name1, target: name2, 
          label: label}, classes: type});
        return true;
      }
      return false;
    }

    createEntity(name, label) {
      return this.addNode(name, label, 'entity');
    }

    createAgent(name, label) {
      return this.addNode(name, label, 'agent');
    }

    createActivity(name, label) {
      return this.addNode(name, label, 'activity');
    }

    createGroup(name) {
      return this.addNode(name, name, 'group');
    }

    memberOf(name, group) {
      var that = this;
      var index = -1;

      // Add edges
      $.each(this.edges, function(i,e) {
        if (e.data.source === name){
          that.addEdge(group, e.data.target, e.classes, e.data.label);
        } else if (e.data.target === name) {
          that.addEdge(e.data.source, group, e.classes, e.data.label);
        }
      });

      // Delete original node
      $.each(this.nodes, function(i,e) {
        if (e.data.id === name) {
          index = i;
        }
      });

      if (index > -1) {
        this.nodes.splice(index, 1);
      }
    }

    wasDerivedFrom(name1, name2) {
      return this.addEdge(name1, name2, 'derived', 'wasDerivedFrom');
    }

    specialisationOf(name1, name2) {
      return this.addEdge(name1, name2, 'specialised', 'specialisationOf');
    }

    alternateOf(name1, name2) {
      return this.addEdge(name1, name2, 'alternate', 'alternateOf');
    }

    wasAttributedTo(name1, name2) {
      return this.addEdge(name1, name2, 'attributed', 'wasAttributedTo');
    }

    wasGeneratedBy(name1, name2) {
      return this.addEdge(name1, name2, 'generated', 'wasGeneratedBy');
    }

    wasAssociatedWith(name1, name2) {
      return this.addEdge(name1, name2, 'associated', 'wasAssociatedWith');
    }

    used(name1, name2) {
      return this.addEdge(name1, name2, 'used', 'used');
    }

    handleEvent(event) {
      console.log("event run");
    }

    render(inner, callback) {
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
            window.pvis = that;
            console.log(this);
            this.on('tap', 'node', that.clickFunction.bind(that));
            if (typeof callback === 'function') { 
              callback();
            }
          }
        });
      });
    }

    nodeCount() {
      return this.nodes.length;
    }

    edgeCount() {
      return this.edges.length;
    }

  };
}());

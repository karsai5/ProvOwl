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
    addUngroupButton(node) {
      this.information += "<button class=\"button\" onclick=\"pvis.unGroupNode('" + node.data().id + "');\">Ungroup</button>";
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
      this.cy = null;
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

    makeid() {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

      for( var i=0; i < 5; i++ ){
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }

      return text;
    }

    clearSelectedNodes() {
      cy.$('node').removeClass('selected');
    }

    unGroupNode(id) {
      var node = cy.getElementById(id);
      var x = node.position('x');
      var y = node.position('y');
      $.each(node[0].data().groupedElements, function(i, e) {
        e.position({x:x, y:y}); // children to current parent position
        e.restore(); // restore
        // animate to original position
        e.animate({position: {x: e.data('originalX'), y: e.data('originalY')}, 
          duration: 500});
      });
      node.remove();
    }

    groupSelectedNodes() {
      var that = this;
      var groupElements = Array.prototype.slice.call( cy.nodes('.selected'), 0);

      // Get position of new node
      var x = groupElements[0].position('x');
      var y = groupElements[0].position('y');

      // Remove edges from graph
      // cy.nodes('.selected').animate({position: {x:x, y:y}, duration: 500});
      cy.nodes('.selected').each(function(i,ele) {
        ele.data('originalX', ele.position('x'));
        ele.data('originalY', ele.position('y'));
        ele.animate({position: {x:x, y:y}, duration: 500});
      });

      setTimeout(function() {
        $.each(groupElements, function (i, e) {
          $.each(e.neighbourhood(), function(x, n) {
            if (n.isEdge()) {
              groupElements.push(n);
              n.remove();
            }
          });
          e.remove();
        });

        // Make groupnode
        var id = that.makeid();
        cy.add({
          group: "nodes",
          data: { id: id, name: id, type: id, groupedElements: groupElements},
          classes: 'group',
          position: { x: x, y: y }
        });

        // add edges that should be connected to group node
        $.each(groupElements, function(i,e) {
          if (e.isEdge()) {
            cy.add({
              group: "edges",
              data: { 
                id: e.data().source + '-' + id, 
                source: e.data().source,
                target: id,
                label: e.data().label
              }
            });
            cy.add({
              group: "edges",
              data: { 
                id: id + '-' + e.data().target,
                source: e.data().target,
                target: id,
                label: e.data().label
              }
            });
          }
        });
      }, 500);
    }

    clickNodeEvent(evt) {
      var node = evt.cyTarget;
      var informationObject = new informationString();
      this.selectedNode = node;

      // Highlight node and clear old selected node
      // Unless ctrl is held
      if (!evt.originalEvent.ctrlKey) {
        this.clearSelectedNodes();
      }
      this.selectedNode.addClass('selected');

      // Create information string
      informationObject.add("ID", node.id());
      informationObject.add("Connected Nodes", " ");
      $.each(node.neighborhood(), function(i, e) {
        if (e.isNode()) {
          informationObject.add(" - " + e.id());
        }
      });

      if (node.hasClass('group')) {
        informationObject.addUngroupButton(node);
      }

      this.printNodeInfo(informationObject.print());
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

    resetLayout(name) {
      cy.$().layout({
        name: name, 
        animate: true,
        fit: false,
      });
    }

    resetView() {
      cy.animate({
        fit: {},
        duration: 500,
      });
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

            // add tap bindings
            this.on('tap', function(event) {
              var evtTarget = event.cyTarget; 

              if (evtTarget === cy) { // clicked on background
                that.clearSelectedNodes();
              } else if (evtTarget.group() === 'edges') { // clicked on edge
                console.log('clicked on edge');
              } else if (evtTarget.group() === 'nodes') { // clicked on node
                that.clickNodeEvent(event);
              }

            });

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

    logUnexpectedVariables(what) {
      print("Can't create " + what + ": unexpected variables");
    }

    logDuplicate(what, name) {
      print("Can't create duplicate " + what + "\"" + name + "\" already exists");
    }

    logMissingNode(what, name) {
      print("Can't create " + what + "\"" + name + "\" doesn't exist");
    }

  };
}());

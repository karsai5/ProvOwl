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
      this.hangingEdges = [];
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

    restoreHangingEdges() {
      var removeIds = [];
      var that = this;
      $.each(this.hangingEdges, function(i,ele) {
        if (cy.getElementById(ele.data().source).length === 1 &&
            cy.getElementById(ele.data().target).length === 1) {
          ele.restore();
          removeIds.push(i);
        }
      });
      $.each(removeIds, function(i, id) {
        that.hangingEdges.splice(id, 1);
      });
      console.log(this.hangingEdges);
    }

    unGroupNode(id) {
      var node = cy.getElementById(id);
      var that = this;
      var x = node.position('x');
      var y = node.position('y');
      var originalNodes = node.data().originalNodes;
      var originalEdges = node.data().originalEdges;

      // Restore original Nodes
      $.each(originalNodes, function(i, ele) {
        ele.restore();
        ele.animate({position: {x: ele.data('originalX'), y: ele.data('originalY')}, 
          duration: 500});
        // remove original fields to save space
        ele.removeData('originalX originalY group');
      });

      this.restoreHangingEdges();

      // Restore original Edges
      $.each(originalEdges, function(i, ele) {
        if (cy.getElementById(ele.data().source).length === 1 &&
            cy.getElementById(ele.data().target).length === 1) {
          ele.restore();
        } else {
          that.hangingEdges.push(ele);
        }
      });

      // $.each(node[0].data().groupedElements, function(i, e) {
      //   e.position({x:x, y:y}); // children to current parent position
      //   e.restore(); // restore
      //   // animate to original position
      //   e.animate({position: {x: e.data('originalX'), y: e.data('originalY')}, 
      //     duration: 500});
      //   // remove original fields to save space
      //   e.removeData('originalX');
      //   e.removeData('originalY');
      // });
      node.remove();
    }

    groupSelectedNodes() {
      var that = this;
      var groupElements = cy.nodes('.selected');

      // Get position of new node
      var x = groupElements.position('x');
      var y = groupElements.position('y');

      // Animate nodes into group position
      cy.nodes('.selected').each(function(i,ele) {
        ele.data('originalX', ele.position('x'));
        ele.data('originalY', ele.position('y'));
        ele.animate({position: {x:x, y:y}, duration: 500});
      });

      // Wait for animation to complete
      setTimeout(function() {
        // create hash table of ids
        var idHash = {};
        groupElements.each(function(i, ele){
          idHash[ele.id()] = true;
        });

        // Make groupnode
        var id = that.makeid();
        var groupNode = cy.add({
          group: "nodes",
          data: { id: id, name: id, type: 'group'},
          classes: 'group',
          position: { x: x, y: y }
        });

        // Save original nodes and edges
        // and create duplicate edges connedted to groupnode
        var originalNodes = [];
        var originalEdges = [];
        var neighbourhood = groupElements.union(groupElements.neighbourhood());
        for (var i=0; i < neighbourhood.length; i++) { // loop through neighbourhood
          var ele = neighbourhood[i];
          if (ele.isNode() && idHash[ele.id()] === true) { // if node in group
            ele.data('group', groupNode.id());
            originalNodes.push(ele);
            ele.remove();
          } else if (ele.isEdge()) { // if edge
            originalEdges.push(ele);
            var source = "";
            var target = "";
            // set source and target correctly
            if (idHash[ele.data('source')] === true && // if source is in group
                idHash[ele.data('target')] === undefined) {
              source = groupNode.id();
              target = ele.data('target');
            } else if (idHash[ele.data('target')] === true && // if target is in group
                idHash[ele.data('source')] === undefined) {
              source = ele.data('source');
              target = groupNode.id();
            }

            if (source !== "" && target !== "") { // check it's not an internal edge
              // check edge doesn't already exist
              var newid = source + '-' + target;
              if (cy.getElementById(newid).length === 0) { 
                cy.add({ // add edge to graph
                  group: "edges",
                  data: { 
                    id: newid, 
                    source: source,
                    target: target,
                    label: ele.data().label
                  }
                });
              }
            }
          }
        }

        // Add originals to group nodes
        groupNode.data('originalNodes', originalNodes);
        groupNode.data('originalEdges', originalEdges);

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
      var data = node.data();
      for (var property in data) {
        if (data.hasOwnProperty(property)){
          informationObject.add(property, data[property]);
        }
      }
      if (node.hasClass('group')) {
        informationObject.addUngroupButton(node);
      }

      this.printNodeInfo(informationObject.print());
    }

    printNodeInfo(text) {
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

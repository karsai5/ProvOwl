/* jshint unused:false, esnext: true, strict: false */
/* globals w1, cy */
"use strict";

/**
 * Simple node implemenation, has a parent, children and a boolean to check
 * whether it's root or not.
 * @constructor
 */
function Node(data, isGroup) {
  this.data = data;
  this.parent = null;
  this.children = [];
  this.isRoot = false;
  /**
   * Remove a child from the nodes children
   * @param {string} id String id for node you want to remove.
   */
  this.removeChild = function(id) {
    var index = -1;
    for (var i=0; i<this.children.length; i++) {
      if (this.children[i].data === id){
        index = i;
      }
    }
    if (index > -1) {
      this.children.splice(index, 1);
    }
  };
}

/**
 * The group manager is the primary way of keeping track of nodes that are
 * hidden inside composite nodes. It keeps a tree that holds all the groups as
 * well as their respective chiltren. This is then used to find the upper group
 * when looking for a child (groups can contain more groups).
 * @constructor
 */
function GroupManager() {
  this.root = new Node('root');
  this.root.isRoot = true;
}

/**
 * Adds a group to be monitored by the GroupManager
 * @param {string} id - The id of the group you want to add
 */
GroupManager.prototype.addGroup = function(id, nodes, parent) {
  var node = new Node(id);
  node.parent = this.root;
  this.root.children.push(node);
  $.each(nodes, function(i, n) {
    var child = new Node(n.id());
    child.parent = node;
    node.children.push(child);
  });
};

/**
 * Remove a group from the manage (ie. during ungrouping)
 * It removes the group, disconnects all the leaf children and attaches
 * other groups to parent
 * @param {string} id - Id of the node you want removed
 */
GroupManager.prototype.removeGroup = function(id) {
  var groupNode = this.find(id);
  if (groupNode === undefined) {
    console.warn("Failed to remove group from GroupManager: '" + id + 
        "' doesn't seem to exits");
  } else {
    // remove all children, add groups to parent
    for (var i=0; i < groupNode.children.length; i++) {
      var node = groupNode.children[i];
      if (node.children.length > 0){ // is group
        node.parent = groupNode.parent;
      } else { // is node
        node.parent = null;
      }
    }
    groupNode.parent.removeChild(id);
    groupNode.parent = null;
    groupNode.children = [];
  }
};

/**
 * Recursively finds a node and returns it
 * @param {string} id - the id of the node you want returned
 * @return {Node} node - the searched for node or if it's not in the group
 * manager returns undefined.
 */
GroupManager.prototype.find = function(id, node) {
  // if no node set, get root
  if (node === undefined) { node = this.root; } 

  // for each child
  for (var i=0; i<node.children.length; i++) {
    if (node.children[i].data === id) {
      return node.children[i];
    } else {
      var result = this.find(id, node.children[i]);
      if (result !== undefined) { return result; }
    }
  }
};

/**
 * Serch up through parents to find topmost group
 * @param {string} id - Id of node you want the parent of
 */
GroupManager.prototype.getParent = function(id) {
  // if node already in dom just return it
  if (cy.getElementById(id).length === 1) {
    return id;
  }

  var currentNode = this.findLeaf(id);
  if (currentNode !== undefined) {
    while (currentNode.parent.isRoot === false) {
      currentNode = currentNode.parent; 
    }
    return currentNode.data;
  }
};

/**
 * Find a certain leaf. Doesn't check centre nodes so it's a bit faster
 * that the find function.
 * @param {string} id - Id of node you want the parent of
 */
GroupManager.prototype.findLeaf = function(id, node) {
  var that = this;
  if (node === undefined) {
    node = this.root;
  }
  if (node.children.length > 0) {
    for (var i = 0; i < node.children.length; i++) {
      var value = this.findLeaf(id, node.children[i]);
      if (value !== undefined) {
        return value;
      }
    }
  } else {
    if (node.data === id) {
      return node;
    }
  }
};


function informationString() {
  this.information = "";
}

informationString.prototype.add = function(c1, c2) {
  if (c2 === undefined) {
    this.information += c1 + "<br>";
  } else {
    this.information += "<b>" + c1 + "</b> " + c2 + "<br>";
  }
};

informationString.prototype.newline = function() {
  this.information += "<br>";
};

informationString.prototype.addUngroupButton = function(node) {
  this.information += "<button class=\"button\" onclick=\"pvis.unGroupNode('" + node.data().id + "');\">Ungroup</button>";
};

informationString.prototype.print = function() {
  return this.information;
};

function PVisualiser() {
  console.log('Provenance visualiser initialised.');
  this.nodes = [];
  this.edges = [];
  this.hangingEdges = [];
  this.cy = null;
  this.GroupManager = new GroupManager();
}

// Print to user log using window.w1, if that undefined
// use the console instead
PVisualiser.prototype.print = function(msg) {
  if (typeof w1 === 'undefined') {
    console.warn(msg);
  } else {
    w1.add(msg);
  }
};

PVisualiser.prototype.makeid = function() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 5; i++ ){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
};

PVisualiser.prototype.clearSelectedNodes = function() {
  cy.$('node').removeClass('selected');
};

PVisualiser.prototype.restoreHangingEdges = function() {
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
};

PVisualiser.prototype.unGroupNode = function(id) {
  var node = cy.getElementById(id);
  var that = this;
  var x = node.position('x');
  var y = node.position('y');
  var originalNodes = node.data().originalNodes;
  var originalEdges = node.data().originalEdges;

  // Restore original Nodes in positions relative to original
  $.each(originalNodes, function(i, ele) {
    var xDifference = ele.position('x') - ele.data('originalX');
    var yDifference = ele.position('y') - ele.data('originalY');
    ele.position('x', x);
    ele.position('y', y);
    ele.restore();
    ele.animate({position: {x: x-xDifference, y: y-yDifference}, 
      duration: 500});
    // remove original fields to save space
    ele.removeData('originalX originalY group');
  });

  this.restoreHangingEdges();

  // Restore original Edges
  $.each(originalEdges, function(i, ele) {
    if( cy.getElementById(ele.data().source).length === 1 &&
        cy.getElementById(ele.data().target).length === 1) {
      ele.restore();
    } else {
      var source = that.GroupManager.getParent(ele.data().source);
      var target = that.GroupManager.getParent(ele.data().target);
      if (source !== undefined && target !== undefined ) {
        cy.add({
          group: "edges", data: { 
            id: source + '-' + target, 
            target: target,
            source: source,
            label: ele.data().label
          }
        });
      }

      that.hangingEdges.push(ele);
    }

  });
  this.GroupManager.removeGroup(node.id());
  node.remove();
};

PVisualiser.prototype.groupSelectedNodes = function() {
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

    // Add to GroupManager
    that.GroupManager.addGroup(id, originalNodes);

  }, 500);
};

PVisualiser.prototype.clickNodeEvent = function(evt) {
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
};

PVisualiser.prototype.printNodeInfo = function(text) {
  text = text.replace(/\n/g, '<br>');
  $("#node_info").html(text);
};

PVisualiser.prototype.nodeExists = function(name) {
  // If cy exists use it's check function
  if (cy.getElementById !== undefined) {
    console.log(cy);
    return cy.getElementById(name).length === 1;
  }
  // otherwise use the node list to check
  var found = false;
  $.each(this.nodes, function() {
    if (name === this.data.id) {
      found = true;
      return;
    }
  });
  return found;
};

PVisualiser.prototype.getNode = function(name) {
  var found = null;
  $.each(this.nodes, function() {
    if (name === this.data.id) {
      found = this;
      return;
    }
  });
  return found;
};

PVisualiser.prototype.addNode = function(name, label, type) {
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
};

// @name1: first node
// @name2: second node
// @type: desc of type eg. derived
// @label: label to be applied eg. wasDerivedFrom
PVisualiser.prototype.addEdge = function(name1, name2, type, label) {
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
};

PVisualiser.prototype.createEntity = function(name, label) {
  return this.addNode(name, label, 'entity');
};

PVisualiser.prototype.createAgent = function(name, label) {
  return this.addNode(name, label, 'agent');
};

PVisualiser.prototype.createActivity = function(name, label) {
  return this.addNode(name, label, 'activity');
};

PVisualiser.prototype.createGroup = function(name) {
  return this.addNode(name, name, 'group');
};

PVisualiser.prototype.memberOf = function(name, group) {
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
};

PVisualiser.prototype.wasDerivedFrom = function(name1, name2) {
  return this.addEdge(name1, name2, 'derived', 'wasDerivedFrom');
};

PVisualiser.prototype.specialisationOf = function(name1, name2) {
  return this.addEdge(name1, name2, 'specialised', 'specialisationOf');
};

PVisualiser.prototype.alternateOf = function(name1, name2) {
  return this.addEdge(name1, name2, 'alternate', 'alternateOf');
};

PVisualiser.prototype.wasAttributedTo = function(name1, name2) {
  return this.addEdge(name1, name2, 'attributed', 'wasAttributedTo');
};

PVisualiser.prototype.wasGeneratedBy = function(name1, name2) {
  return this.addEdge(name1, name2, 'generated', 'wasGeneratedBy');
};

PVisualiser.prototype.wasAssociatedWith = function(name1, name2) {
  return this.addEdge(name1, name2, 'associated', 'wasAssociatedWith');
};

PVisualiser.prototype.used = function(name1, name2) {
  return this.addEdge(name1, name2, 'used', 'used');
};

PVisualiser.prototype.handleEvent = function(event) {
  console.log("event run");
};

PVisualiser.prototype.resetLayout = function(name) {
  cy.$().layout({
    name: name, 
    animate: true,
    fit: false,
  });
};

PVisualiser.prototype.resetView = function() {
  cy.animate({
    fit: {},
    duration: 500,
  });
};

PVisualiser.prototype.render = function(inner, callback) {
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
};

PVisualiser.prototype.nodeCount = function() {
  return this.nodes.length;
};

PVisualiser.prototype.edgeCount = function() {
  return this.edges.length;
};

PVisualiser.prototype.logUnexpectedVariables = function(what) {
  this.print("Can't create " + what + ": unexpected variables");
};

PVisualiser.prototype.logDuplicate = function(what, name) {
  this.print("Can't create duplicate " + what + "\"" + name + "\" already exists");
};

PVisualiser.prototype.logMissingNode = function(what, name) {
  this.print("Can't create " + what + "\"" + name + "\" doesn't exist");
};

/** 
 * @fileOverview This file contains the main @line{PVisualiser} class used for
 * rendering a provenance graph.
 * jshint unused:false, esnext: true, strict: false 
 * globals w1, cy 
 */
"use strict";

function clone(obj) {
	if (null == obj || "object" != typeof obj) return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}
	return copy;
}

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
		for (var i = 0; i < this.children.length; i++) {
			if (this.children[i].data === id) {
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
		for (var i = 0; i < groupNode.children.length; i++) {
			var node = groupNode.children[i];
			if (node.children.length > 0) { // is group
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
	if (node === undefined) {
		node = this.root;
	}

	// for each child
	for (var i = 0; i < node.children.length; i++) {
		if (node.children[i].data === id) {
			return node.children[i];
		} else {
			var result = this.find(id, node.children[i]);
			if (result !== undefined) {
				return result;
			}
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

informationString.prototype.render = function(nodes, options) {
	// For single nodes
	if (nodes.length === 1) {
		var data = nodes.data();
		for (var property in data) { // loop through data
			if (data.hasOwnProperty(property)) {
				if (property == 'properties' && data[property] !== undefined) { // loop through properties
					this.information += "<hr>";
					for (var p in data[property]) {
						if (data[property].hasOwnProperty(p)) {
							this.add(p, data[property][p])
						}
					}
				} else {
					this.add(property, data[property]);
				}
			}
		}
	} else { // Multiple selected nodes
		this.information += "<b>Mulitple nodes selected:</b><br>";
		for (var i = 0; i < nodes.length; i++) {
			this.information += nodes[i].data().name + "<br>";
		}
	}

	this.information += "<hr>";

	if (nodes.length === 1) { // for single nodes
		if (nodes.hasClass('group')) {
			this.addUngroupLink(nodes);
			this.information += "<br>";
		}

		this.addConsoleLogLink(nodes);
		this.addRenameLink(nodes);
	} else { // multiple selected nodes
		this.addGroupLink();
	}
	return this.information;
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

informationString.prototype.addGroupLink = function() {
	this.information +=
		"<a href=\"#\" onclick=\"pvis.groupSelectedNodes();\">Group Nodes</a>";
};

informationString.prototype.addUngroupLink = function(node) {
	this.information += "<a href=\"#\" onclick=\"pvis.unGroupNode('" + node.data()
		.id + "');\">Ungroup</a>";
};

informationString.prototype.addUngroupButton = function(node) {
	this.information +=
		"<button class=\"button\" onclick=\"pvis.unGroupNode('" + node.data().id +
		"');\">Ungroup</button>";
};

informationString.prototype.addConsoleLogLink = function(node) {
	this.information +=
		"<a href=\"#\" onclick=\"pvis.printNodeInfoToConsole('" +
		node.data().id + "');\">Console log</a><br>";
}

informationString.prototype.addRenameLink = function(node) {
	this.information += "<a href=\"#\" onclick=\"pvis.renameNode('" +
		node.data().id + "');\">Rename node</a>";
}

informationString.prototype.print = function() {
	return this.information;
};

/**
 * The PVisualiser is the main object that creates and renders a provenance
 * graph.
 * @constructor
 */
function PVisualiser() {
	console.log('Provenance visualiser initialised.');
	this.nodes = [];
	this.edges = [];
	this.hangingEdges = [];
	this.cy = null;
	this.GroupManager = new GroupManager();
	this.history = new VisHistory();
}

/**
 * Print to user log using window.w1, if that's undefined use the console instead
 * @param {string} msg The message you want to have shown
 */
PVisualiser.prototype.print = function(msg) {
	if (typeof w1 === 'undefined') {
		console.warn(msg);
	} else {
		w1.add(msg);
	}
};

/**
 * Using letters and numbers create a random id 5 characters long.
 * @return {string} id Random id eg: 7Q2nm, lCQDg or I2v4E
 */
PVisualiser.prototype.makeid = function() {
	var text = "";
	var possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < 5; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return text;
};

/**
 * Remove selected class from all nodes. This will remove the visual selected
 * indicator (red outline) as well.
 */
PVisualiser.prototype.clearSelectedNodes = function() {
	cy.$('node').removeClass('selected');
};

/*
 * Hanging edges are edges that are connected to nodes that are currently not
 * in the graph (for example in a group). This function loops through the
 * hanging edges and checks if any can be restored, restoring them if it can.
 */
PVisualiser.prototype.restoreHangingEdges = function() {
	var removeIds = [];
	var that = this;
	$.each(this.hangingEdges, function(i, ele) {
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

/**
 * Remove a composite node and move nodes back to their original position
 * relative to where the composite node has been moved. 
 * @param {string} id The id string of the group you want to uncluster
 */
PVisualiser.prototype.unGroupNode = function(id, noHistory) {
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
		ele.animate({
			position: {
				x: x - xDifference,
				y: y - yDifference
			},
			duration: 500
		});
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
			var source = that.GroupManager.getParent(ele.data().source);
			var target = that.GroupManager.getParent(ele.data().target);
			if (source !== undefined && target !== undefined) {
				cy.add({
					group: "edges",
					data: {
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

	// add to history
	if (noHistory !== false) {
		var child = originalNodes[0];
		this.history.addStep(new Step('Ungroup node',
			function() {
				cy.$('node').removeClass('selected');
				for (var i = 0; i < originalNodes.length; i++) {
					originalNodes[i].addClass('selected');
				}
				that.groupSelectedNodes();
			},
			function() {
				that.unGroupNode(that.GroupManager.getParent(child.data().id), false);
			}));
	}
};

/**
 * Remove the selected nodes from the graph and replace them instead with
 * a compiste node with all the same edges. No arguments are required as it
 * groups any nodes with the 'selected' class.
 */
PVisualiser.prototype.groupSelectedNodes = function(noHistory) {
	var that = this;
	var groupElements = cy.nodes('.selected');

	// Get position of new node
	var x = groupElements.position('x');
	var y = groupElements.position('y');

	// Animate nodes into group position
	cy.nodes('.selected').each(function(i, ele) {
		ele.data('originalX', ele.position('x'));
		ele.data('originalY', ele.position('y'));
		ele.animate({
			position: {
				x: x,
				y: y
			},
			duration: 500
		});
	});

	// Wait for animation to complete
	setTimeout(function() {
		// create hash table of ids
		var idHash = {};
		groupElements.each(function(i, ele) {
			idHash[ele.id()] = true;
		});

		// Make groupnode
		var id = that.makeid();
		var groupNode = cy.add({
			group: "nodes",
			data: {
				id: id,
				name: id,
				type: 'group'
			},
			classes: 'group',
			position: {
				x: x,
				y: y
			}
		});

		// Save original nodes and edges
		// and create duplicate edges connedted to groupnode
		var originalNodes = [];
		var originalEdges = [];
		var rootname = "node[id='" + cy.elements().roots()[0].id() + "']";
		var nameCandidate = {
			distance: -1,
			name: ''
		};
		var neighbourhood = groupElements.union(groupElements.neighbourhood());
		window.n = neighbourhood;
		for (var i = 0; i < neighbourhood.length; i++) { // loop through neighbourhood
			var ele = neighbourhood[i];
			if (ele.isNode() && idHash[ele.id()] === true) { // if node in group
				ele.data('group', groupNode.id());
				originalNodes.push(ele);

				// Check if eligible to be cluster title via smallest distance
				// from the root node.
				var nodename = "node[id='" + ele.id() + "']";
				var distanceFromRoot = 0;
				if (nodename !== rootname) { // if not root node
					distanceFromRoot = cy.elements().aStar({
						root: rootname,
						goal: nodename
					}).distance;
				}
				if (nameCandidate.distance === -1 ||
					distanceFromRoot < nameCandidate.distance) {
					nameCandidate = {
						distance: distanceFromRoot,
						name: ele.id()
					};
				}

				ele.remove(); // delete node
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

		// Rename node with candidate name
		groupNode.data('name', PParser.removePrefix(nameCandidate.name) +
			" group");

		// Add originals to group nodes
		groupNode.data('originalNodes', originalNodes);
		groupNode.data('originalEdges', originalEdges);

		// Add to GroupManager
		that.GroupManager.addGroup(id, originalNodes);

		// Select new groupnode
		that.selectNode(groupNode.data().name);

		// Add to history
		if (noHistory !== null) {
			var child = originalNodes[0];
			that.history.addStep(new Step('Group node',
				function ungroupNode() {
					that.unGroupNode(that.GroupManager.getParent(child.data().id), false);
				},
				function regroupNode() {
					cy.$('node').removeClass('selected');
					for (var i = 0; i < originalNodes.length; i++) {
						originalNodes[i].addClass('selected');
					}
					that.groupSelectedNodes(false);
				}));
		}

	}, 500);
};

/**
 * Bound to they Cytoscape.js object, this will fire whenever something in the
 * graph is clicked. It will check what type of object was clicked (node,
 * group, edge) and act appropriately.
 */
PVisualiser.prototype.clickNodeEvent = function(evt) {
	this.selectNode(evt);
};

PVisualiser.prototype.selectNode = function(thing) {
	var node = thing; // get node element 
	var informationObject = new informationString();
	if (thing.cyTarget !== undefined) {
		node = thing.cyTarget;
	} else if (typeof(thing) === 'string') { // if string find node
		node = cy.getElementById(thing);
	}
	this.selectedNode = node;
	if (thing.originalEvent === undefined || !thing.originalEvent.ctrlKey) {
		this.clearSelectedNodes();
	}
	this.selectedNode.addClass('selected');
	$('.node_info_wrapper').show();
	this.printNodeInfo(informationObject.render(cy.$('.selected')));
};

PVisualiser.prototype.printNodeInfo = function(text) {
	text = text.replace(/\n/g, '<br>');
	$("#node_info").html(text);
};

/**
 * Outputs the node object to the console where it can be explored.
 * @param {string} id The id of the node to explore
 */
PVisualiser.prototype.printNodeInfoToConsole = function(id) {
	var node = cy.getElementById(id);
	if (node.length > 0) {
		console.log(node);
	} else {
		console.warn("No node with the id: " + id);
	}
};

PVisualiser.prototype.renameNode = function(id, name) {
	var node = cy.getElementById(id);
	if (!name) {
		name = prompt("Enter new node name");
	}
	if (node.length > 0) {
		node.data('name', name);
	} else {
		console.warn("No node with the id: " + id);
	}
}

/**
 * Checks to see if a node exists in the dom, note this doesn't include nodes
 * currently inside groups.
 * @param {string} name ID of the node you want to check exists
 * @return {bool} found True if the node is in the dom
 */
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

/**
 * Add a node to the graph.
 * @param {String} name Unique ID for the node eg. itr:X-Tweets-3
 * @param {String} label Reading friendly version of node eg. X Tweets 3
 * @param {String} type the type of node, eg. action, person
 * @param {Object} propreties of the node
 * @return {bool} True if the node was added, False if it was not.
 */
PVisualiser.prototype.addNode = function(params) {
	if (typeof params.name !== 'string' || typeof params.label !== 'string') {
		this.logUnexpectedVariables(params.type);
	} else if (this.nodeExists(params.name)) {
		this.logDuplicate(params.type, params.name);
	} else {
		this.nodes.push({
			data: {
				id: params.name,
				name: params.label,
				type: params.type,
				properties: params.properties
			},
			classes: params.type
		});
		return true;
	}
	return false;
};

/**
 * Add an edge to the graph.
 * @param {String} sourceID The node that the edge originates from
 * @param {String} targetID The node that the edge terminates at
 * @param {String} type Desc of type eg. derived
 * @param {String} label label to be applied eg. wasDerivedFrom
 */
PVisualiser.prototype.addEdge = function(name1, name2, type, label) {
	if (typeof name1 !== 'string' || typeof name2 !== 'string') {
		this.logUnexpectedVariables(type + ' edge');
	} else if (!this.nodeExists(name1)) {
		this.logMissingNode(type + ' edge', name1);
	} else if (!this.nodeExists(name2)) {
		this.logMissingNode(type + ' edge', name2);
	} else {
		this.edges.push({
			data: {
				id: name1 + '-' + name2,
				source: name1,
				target: name2,
				label: label
			},
			classes: type
		});
		return true;
	}
	return false;
};

PVisualiser.prototype.createEntity = function(name, label, properties) {
	return this.addNode({
		name: name,
		label: label,
		type: 'entity',
		properties: properties
	});
};

PVisualiser.prototype.createAgent = function(name, label, properties) {
	return this.addNode({
		name: name,
		label: label,
		type: 'agent',
		properties: properties
	});
};

PVisualiser.prototype.createActivity = function(name, label, properties) {
	return this.addNode({
		name: name,
		label: label,
		type: 'activity',
		properties: properties
	});
};

PVisualiser.prototype.createGroup = function(name, properties) {
	return this.addNode({
		name: name,
		label: name,
		type: 'group',
		properties: properties
	});
};

PVisualiser.prototype.memberOf = function(name, group) {
	var that = this;
	var index = -1;

	// Add edges
	$.each(this.edges, function(i, e) {
		if (e.data.source === name) {
			that.addEdge(group, e.data.target, e.classes, e.data.label);
		} else if (e.data.target === name) {
			that.addEdge(e.data.source, group, e.classes, e.data.label);
		}
	});

	// Delete original node
	$.each(this.nodes, function(i, e) {
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

PVisualiser.prototype.actedOnBehalfOf = function(name1, name2) {
	return this.addEdge(name1, name2, 'acted', 'actedOnBehalfOf');
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

PVisualiser.prototype.renderJson = function(inner, json, callback) {
	this.nodes = json.elements.nodes;
	this.edges = json.elements.edges;
	this.render({
		inner: inner,
		callback: callback,
		layout: 'preset'
	});
};

/**
 * Main render function, shows graph in the DOM.
 * @param {object} dictionary
 * inner: Inner Jquery selecter of DOM element you want to render the
 * graph in e.g. "#cy"
 * callback: A function you would like to run after the graph
 * has been rendered.
 * layout: the layout type to use, eg. dagre or preset
 */
PVisualiser.prototype.render = function(params) {
	if (typeof params.inner !== 'string') {
		throw new Error("Can't render graph: Unexpected Variables");
	}
	if (params.layout === undefined) {
		params.layout = 'dagre';
	}
	this.inner = params.inner;
	var that = this;
	$.get('/static/css/cytoscape.css', function(data) {
		$(params.inner).cytoscape({
			layout: {
				name: params.layout,
				padding: 150
			},
			style: data,
			elements: {
				nodes: that.nodes,
				edges: that.edges
			},

			ready: function() {
				addHooks.call(this, that, params.callback);
			}
		});
	});
};

function addHooks(pvis, callback) {
	window.cy = this;
	window.pvis = pvis;

	// add movement bindings
	this.on('grab', function(event) {
		pvis.oldPosition = clone(event.cyTarget.position());
		var groupElements = cy.nodes('.selected');
		pvis.selectedNodes = groupElements;
	});
	this.on('free', function(event) {
		// add to history 
		var position_old = clone(pvis.oldPosition);
		var position_new = clone(event.cyTarget.position());
		// grab selected nodes
		var selectedNodes = pvis.selectedNodes.slice();
		if (selectedNodes.length === 0) { // if none selected, use event node
			selectedNodes = selectedNodes.add(event.cyTarget);
		}
		if (position_old.x !== position_new.x ||
			position_old.y !== position_new.y) {
			pvis.history.addStep(new Step('Move node',
				function undo() {
					selectedNodes.each(function(i, ele) {
						var new_x = ele.position().x - position_new.x;
						var new_y = ele.position().y - position_new.y;
						ele.animate({
							position: {
								x: position_old.x + new_x,
								y: position_old.y + new_y
							},
							duration: 200
						});
					});
				},
				function redo() {
					event.cyTarget.animate({
						position: position_new,
						duration: 200
					});
				}));
		}
	});

	// add tap bindings
	this.on('tap', function(event) {
		var evtTarget = event.cyTarget;

		if (evtTarget === cy) { // clicked on background
			pvis.clearSelectedNodes();
			$('.node_info_wrapper').hide();
		} else if (evtTarget.group() === 'edges') { // clicked on edge
			console.log('clicked on edge');
		} else if (evtTarget.group() === 'nodes') { // clicked on node
			pvis.clickNodeEvent(event);
		}

	});

	if (typeof callback === 'function') {
		callback();
	}
}

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
	this.print("Can't create duplicate " + what + "\"" + name +
		"\" already exists");
};

PVisualiser.prototype.logMissingNode = function(what, name) {
	this.print("Can't create " + what + "\"" + name + "\" doesn't exist");
};

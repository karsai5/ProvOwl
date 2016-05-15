/** 
 * @fileOverview This file contains the main @line{PVisualiser} class used for
 * rendering a provenance graph.
 * jshint unused:false, esnext: true, strict: false 
 * globals w1, cy 
 */
"use strict";

String.prototype.hashCode = function() {
	var hash = 0;
	if (this.length == 0) return hash;
	for (var i = 0; i < this.length; i++) {
		var char = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash.toString();
}

function clone(obj) {
	if (null === obj || "object" !== typeof obj) return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}
	return copy;
}

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
	this.lastClick = {
		element: null,
		time: 0
	};
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
	if (noHistory !== true) {
			console.log('adding history to ungroup');
		var child = originalNodes[0];
		this.history.addStep(new Step('Ungroup node',
			function() {
				cy.$('node').removeClass('selected');
				for (var i = 0; i < originalNodes.length; i++) {
					originalNodes[i].addClass('selected');
				}
				that.groupSelectedNodes(true);
			},
			function() {
				that.unGroupNode(that.GroupManager.getParent(child.data().id), true);
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

	// If 1 or zero elements are selected, don't try to group them
	if (groupElements.length < 2) {
		return;
	}

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
		var id = Object.keys(idHash).sort().join().hashCode();
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
					try {
						distanceFromRoot = cy.elements().aStar({
							root: rootname,
							goal: nodename
						}).distance;
					} catch (err) {
						// catch weird error caused by aStar method
					}
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
		that.selectNode(groupNode.data().id);

		// Add to history
		if (noHistory !== true) {
			console.log('adding history to group');
			var nodesToGroup = originalNodes.slice(0);
			that.history.addStep(new Step('Group node: ' + groupNode.data().name,
				function ungroupNode() {
					that.unGroupNode(groupNode.id(), true);
				},
				function regroupNode() {
					cy.$('node').removeClass('selected');
					for (var i = 0; i < nodesToGroup.length; i++) {
						cy.getElementById(nodesToGroup[i].id()).addClass('selected');
					}
					that.groupSelectedNodes(true);
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
	// check if double click
	if (new Date().getTime() - this.lastClick.time < 500 &&
		this.lastClick.element === evt.cyTarget) {
		// if element is a group, ungroup it
		if (evt.cyTarget.data().type === 'group') {
			this.unGroupNode(evt.cyTarget.id());
		}
	} else {
		this.lastClick.time = new Date().getTime();
		this.lastClick.element = evt.cyTarget;
	}
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

PVisualiser.prototype.regexSelect = function(regex) {
	var nodes = cy.$('node'); // get all nodes
	nodes.removeClass('selected');
	var regexObject = null;
	try {
		regexObject = RegExp(regex); // create regex object from string
	} catch (err) {
		$('.node_info_wrapper').hide();
		return;
	}

	for (var i = 0; i < nodes.length; ++i) {
		var n = nodes[i];
		var data = n.data();
		for (var p in data) { // grab all the data
			if (typeof(data[p]) === "string") { // loop through attributes
				// if string check if regex matches
				if (regexObject.test(data[p])) {
					n.addClass('selected');
				}
			} else if (p === 'properties') { // loop through properties 
				for (var prop in data[p]) {
					if (regexObject.test(data[p][prop])) {
						n.addClass('selected');
					}
				}
			}
		}
		if (cy.$(".selected").length > 0) {
			$('.node_info_wrapper').show();
			var informationObject = new informationString();
			this.printNodeInfo(informationObject.render(cy.$('.selected')));
		} else {
			$('.node_info_wrapper').hide();
		}
	}
};

PVisualiser.prototype.regexGroup = function(regex) {
	this.regexSelect(regex);
	this.groupSelectedNodes();
};

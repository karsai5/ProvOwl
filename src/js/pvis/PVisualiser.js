/** 
 * @fileOverview This file contains the main @line{PVisualiser} class used for
 * rendering a provenance graph.
 * jshint unused:false, esnext: true, strict: false 
 * globals w1, cy 
 */
"use strict";

String.prototype.hashCode = function() {
	var hash = 0;
	if (this.length === 0) return hash;
	for (var i = 0; i < this.length; i++) {
		var char = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash.toString();
};

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
	this.clicks = new ClickTracker();
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
PVisualiser.prototype.unGroupNode = function(id, params) {
	var node = cy.getElementById(id);
	var x = node.position('x'); //position of node
	var y = node.position('y');
	var originalNodes = node.data().originalNodes;
	var originalEdges = node.data().originalEdges;

	// Set default values
	if (params === undefined) {
		params = {};
	}
	if (params.speed === undefined) {
		params.speed = 500;
	}
	if (params.saveHistory === undefined) {
		params.saveHistory = true;
	}
	if (params !== undefined && params.manual !== undefined && params.manual ===
		true) {
		pvis.clicks.add(new Click({
			desc: "Ungrouped Node",
			elementId: id
		}));
	}

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
			duration: params.speed
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
			var source = this.GroupManager.getParent(ele.data().source);
			var target = this.GroupManager.getParent(ele.data().target);
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

			this.hangingEdges.push(ele);
		}

	}.bind(this));

	this.GroupManager.removeGroup(node.id());
	node.remove();

	// add to history
	if (params.saveHistory === true) {
		console.log('adding history to ungroup');
		var child = originalNodes[0];
		this.history.addStep(new Step({
			name: 'Ungroup node',
			undo: function() {
				cy.$('node').removeClass('selected');
				for (var i = 0; i < originalNodes.length; i++) {
					originalNodes[i].addClass('selected');
				}
				this.groupSelectedNodes(true);
			}.bind(this),
			redo: function() {
				this.unGroupNode(this.GroupManager.getParent(child.data().id), {
					saveHistory: false
				});
			}.bind(this)
		}));
	}
};

PVisualiser.prototype.groupNodes = function(params) {
	return new Promise(function(resolve, reject) {

		var groupNodes = {}; // dictionary of nodes to be grouped
		// name of rootnode used in astar algorithm
		var rootname = "node[id='" + cy.elements().roots()[0].id() + "']";
		// node used for name and location
		var parentNode = {
			node: undefined,
			distanceFromRoot: -1
		};

		// Check nodes exist
		if (params.nodes === undefined) {
			var errortext = "Can't group without nodes";
			console.error(errortext);
			reject(Error(errortext));
		} else if (params.nodes.length < 2) {
			var errortext = "Can't make group with less that two nodes";
			console.error(errortext);
			reject(Error(errortext));
		}

		// Set default values
		if (params.speed === undefined) {
			params.speed = 500;
		}
		if (params.saveHistory === undefined) {
			params.saveHistory = true;
		}

		// Loop through node IDs
		for (var i = 0; i < params.nodes.length; i++) {
			var name = params.nodes[i];
			var node = cy.getElementById(name);
			if (node.length > 0) {
				// get distance from root
				var nodename = "node[id='" + name + "']";
				var distanceFromRoot = -1;
				distanceFromRoot = cy.elements().aStar({
					root: rootname,
					goal: nodename
				}).distance;

				// add to groupnodes
				groupNodes[name] = {
					node: node,
					distanceFromRoot: distanceFromRoot
				};

				// set parentnode to node with shortest distance from root
				if (parentNode.distanceFromRoot === -1) { // if no parentnode set yet
					parentNode = groupNodes[name];
				} else if (groupNodes[name].distanceFromRoot < parentNode.distanceFromRoot) {
					parentNode = groupNodes[name];
				}
			} else {
				console.warn('Couldn\'t find node: ' + name);
			}
		}

		// Animate nodes into group position
		for (var name in groupNodes) {
			var node = groupNodes[name].node;
			// save original node positions
			node.data('originalX', node.position('x'));
			node.data('originalY', node.position('y'));
			// animate movement
			node.animate({
				position: {
					x: parentNode.node.position('x'),
					y: parentNode.node.position('y')
				},
				duration: params.speed
			});
		}

		setTimeout(function() {
			// Make cluster node
			var id = Object.keys(groupNodes).sort().join().hashCode(); // use hash of grouped ids
			var clusterNode = cy.add({
				group: "nodes",
				data: {
					id: id,
					name: parentNode.node.data().name + ' group',
					type: 'group'
				},
				classes: 'group',
				position: {
					x: parentNode.node.position('x'),
					y: parentNode.node.position('y')
				}
			});

			// Save original nodes and edges
			// and create duplicate edges connedted to groupnode
			var originalNodes = [];
			var originalEdges = [];
			for (var name in groupNodes) { // loop through neighbourhood
				var ele = groupNodes[name].node;
				var edges = cy.elements('edge[source="' + ele.id() + '"]').union(
					cy.elements('edge[target="' + ele.id() + '"]'));

				if (ele.isNode()) { // if node in group
					originalNodes.push(ele);
					ele.remove(); // delete node
				}

				for (var i = 0; i < edges.length; i++) {
					var edge = edges[i];
					originalEdges.push(edge);
					var source = "";
					var target = "";
					// set source and target correctly
					if (groupNodes[edge.data('source')] !== undefined && // if source is in group
						groupNodes[edge.data('target')] === undefined) {
						source = clusterNode.id();
						target = edge.data('target');
					} else if (groupNodes[edge.data('target')] !== undefined && // if target is in group
						groupNodes[edge.data('source')] === undefined) {
						source = edge.data('source');
						target = clusterNode.id();
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
									label: edge.data().label
								}
							});
						}
					}
				}
			}

			// Add originals to group nodes
			clusterNode.data('originalNodes', originalNodes);
			clusterNode.data('originalEdges', originalEdges);

			// Add to GroupManager
			this.GroupManager.addGroup(clusterNode.id(), originalNodes);

			// Select new groupnode
			this.selectNode(clusterNode.id());

			// Add to history
			if (params.saveHistory === true) {
				this.history.addStep(new Step({
					name: 'Group node: ' + clusterNode.data().name,
					undo: function ungroupNode() {
						this.unGroupNode(clusterNode.id(), {
							saveHistory: false
						});
					}.bind(this),
					redo: function regroupNode() {
						cy.$('node').removeClass('selected');
						this.groupNodes({
							nodes: Object.keys(groupNodes),
							saveHistory: false
						});
					}.bind(this),
					consoleCommand: "pvis.groupNodes({" +
						"nodes: ['" + Object.keys(groupNodes).join("','") + "']," +
						"speed: 0" +
						"})"
				}));
			}

			resolve(clusterNode);
		}.bind(this), params.speed);
	}.bind(this));
};

/**
 * Remove the selected nodes from the graph and replace them instead with
 * a compiste node with all the same edges. No arguments are required as it
 * groups any nodes with the 'selected' class.
 */
PVisualiser.prototype.groupSelectedNodes = function(params) {
	var idArray = $.map(cy.elements('node.selected'), function(value) {
		return value.id();
	});

	if (params !== undefined && params.manual !== undefined && params.manual ===
		true) {
		pvis.clicks.add(new Click({
			desc: "Grouped Nodes",
			event: event,
			elementId: idArray.toString()
		}));
	}

	this.groupNodes({
		nodes: idArray
	});
};

/**
 * Bound to they Cytoscape.js object, this will fire whenever something in the
 * graph is clicked. It will check what type of object was clicked (node,
 * group, edge) and act appropriately.
 */
PVisualiser.prototype.clickNodeEvent = function(evt) {
	// if double click and group, ungroup node
	// check if double click
	if (new Date().getTime() - this.lastClick.time < 500 &&
		this.lastClick.element === evt.cyTarget) {
		// if element is a group, ungroup it
		if (evt.cyTarget.data().type === 'group') {
			this.unGroupNode(evt.cyTarget.id());
		}
		pvis.clicks.add(new Click({
			desc: "Clicked node: double click",
			event: evt
		}));
	} else {
		this.selectNode(evt);
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

// params{
//	  node: id of nodes to move,
//	  toX: {int} location to move to x
//	  toY: {int} location to move to y
//	  speed: {int} animation speed
PVisualiser.prototype.moveNode = function(params) {
	return new Promise(function(resolve, reject) {
		if (params === undefined || params.node === undefined) {
			console.error("Missing paramaters, couldn't move node");
			reject();
		}
		// set defaults
		if (params.speed === undefined) {
			params.speed = 200;
		}

		var node = cy.getElementById(params.node);
		node.animate({
			position: {
				x: params.toX,
				y: params.toY
			},
			duration: params.speed
		});

		// resolve after animation
		setTimeout(function() {
			resolve();
		}, params.speed);
	});
};

// nodes = [{id: node id, toX: x value, toY: y value}, ...]
PVisualiser.prototype.moveNodes = function(nodes) {
	return new Promise(function(resolve, reject) {
		var promises = []; // all the promises

		if (nodes === undefined) {
			console.error("Missing paramaters, couldn't move nodes");
			reject();
		}

		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			promises.push(this.moveNode({
				node: node.id,
				toX: node.toX,
				toY: node.toY,
				speed: node.speed
			}));
		}

		Promise.all(promises).then(resolve);
	}.bind(this));
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
	return new Promise(function(resolve, reject) {
		var node = cy.getElementById(id);
		if (!name) {
			name = prompt("Enter new node name");
			pvis.clicks.add(new Click({
				desc: "Renamed node",
				event: event,
				elementId: id
			}));
		}
		var newName = name.slice(0);
		var oldName = node.data().name.slice(0);
		if (node.length > 0) {
			node.data('name', newName);
		} else {
			console.error("No node with the id: " + id);
			reject();
		}
		pvis.history.addStep(new Step({
			name: 'Rename node',
			undo: function undo() {
				node.data('name', oldName);
			},
			redo: function redo() {
				node.data('name', newName);
			},
			consoleCommand: "pvis.renameNode(\"" + id + "\", \"" + newName +
				"\")"
		}));
		resolve(); // all done!
	});
};

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
 * @param {Object} properties of the node
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
		pvis.clicks.add(new Click({
			desc: "Moved node",
			event: event
		}));
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
			pvis.history.addStep(new Step({
				name: 'Move node',
				undo: function undo() {
					var nodesToMove = [];
					selectedNodes.each(function(i, ele) {
						var new_x = ele.position().x - position_new.x;
						var new_y = ele.position().y - position_new.y;
						nodesToMove.push({
							id: ele.id(),
							toX: position_old.x + new_x,
							toY: position_old.y + new_y
						});
					});
					pvis.moveNodes(nodesToMove);
				},
				redo: function redo() {
					selectedNodes.each(function(i, ele) {
						var new_x = ele.position().x - position_old.x;
						var new_y = ele.position().y - position_old.y;
						pvis.moveNode({
							node: ele.id(),
							toX: position_new.x + new_x,
							toY: position_new.y + new_y
						});
					});
				},
				consoleCommand: function() {
					var nodesToMove = [];
					selectedNodes.each(function(i, ele) {
						var new_x = ele.position().x - position_old.x;
						var new_y = ele.position().y - position_old.y;
						nodesToMove.push({
							id: ele.id(),
							toX: position_new.x + new_x,
							toY: position_new.y + new_y
						});
					});
					var command = "pvis.moveNodes([";
					command += $.map(nodesToMove, function(v) {
						var string = "";
						string += "{id: \"" + v.id + "\", ";
						string += "toX:" + v.toX + ", ";
						string += "toY: " + v.toY + ",";
						string += "speed: 0}";
						return string;
					}).toString();
					command += "])";
					return command;
				}
			}));
		}
	});

	// add tap bindings
	this.on('tap', function(event) {
		var evtTarget = event.cyTarget;

		if (evtTarget === cy) { // clicked on background
			pvis.clearSelectedNodes();
			$('.node_info_wrapper').hide();
			// add to click tracker
			pvis.clicks.add(new Click({
				desc: "Clicked background",
				event: event
			}));
		} else if (evtTarget.group() === 'edges') { // clicked on edge
			// add to click tracker
			pvis.clicks.add(new Click({
				desc: "Clicked node edge",
				event: event
			}));
			console.log('clicked on edge');
		} else if (evtTarget.group() === 'nodes') { // clicked on node
			pvis.clicks.add(new Click({
				desc: "Clicked node",
				event: event
			}));
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

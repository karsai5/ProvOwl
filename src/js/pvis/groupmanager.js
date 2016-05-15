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
GroupManager.prototype.addGroup = function(id, nodes) {
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



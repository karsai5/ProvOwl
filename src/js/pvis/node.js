/**
 * Simple node implemenation, has a parent, children and a boolean to check
 * whether it's root or not.
 * @constructor
 */
function Node(data) {
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

	this.toString = function() {
		return 'Node: ' + data;
	};
}


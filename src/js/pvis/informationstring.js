function informationString() {
	this.information = "";
}

informationString.prototype.render = function(nodes) {
	// For single nodes
	if (nodes.length === 1) {
		var data = nodes.data();
		for (var property in data) { // loop through data
			if (data.hasOwnProperty(property)) {
				if (property === 'properties' && data[property] !== undefined) { // loop through properties
					this.information += "<hr>";
					for (var p in data[property]) {
						if (data[property].hasOwnProperty(p)) {
							this.add(p, data[property][p]);
						}
					}
				} else if (!RegExp('^original.*$').test(property)) {
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
};

informationString.prototype.add = function(c1, c2) {
	if (c2 !== undefined) {
		this.information += "<b>" + c1 + "</b> " + c2 + "<br>";
	}
};

informationString.prototype.newline = function() {
	this.information += "<br>";
};

informationString.prototype.addGroupLink = function() {
	this.information +=
		"<a href=\"#\" onclick=\"pvis.groupSelectedNodes({manual: true});\">Group Nodes</a>";
};

informationString.prototype.addUngroupLink = function(node) {
	this.information += "<a href=\"#\" onclick=\"pvis.unGroupNode('" + node.data()
		.id + "', {manual: true});\">Ungroup</a>";
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
};

informationString.prototype.addRenameLink = function(node) {
	this.information += "<a href=\"#\" onclick=\"pvis.renameNode('" +
		node.data().id + "');\">Rename node</a>";
};

informationString.prototype.print = function() {
	return this.information;
};


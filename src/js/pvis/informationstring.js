function informationString() {
	this.information = "";
}

informationString.prototype.render = function(nodes) {
	// For single nodes, print properties
	if (nodes.length === 1) {
		this.information +=
			"<table class=\"table table-condensed table-bordered\">";
		var data = nodes.data();
		this.add("name", data.name);
		if (data.properties !== undefined) { // loop through properties
			for (var p in data.properties) {
				if (data.properties.hasOwnProperty(p)) {
					this.add(p, data.properties[p]);
				}
			}
		}
		this.information += "</table>";
	} else { // Multiple selected nodes
		this.information += "<hr>";
		this.information += "<b>Mulitple nodes selected:</b><br>";
		for (var i = 0; i < nodes.length; i++) {
			this.information += nodes[i].data().name + "<br>";
		}
		this.information += "<hr>";
	}


	if (nodes.length === 1) { // for single nodes
		if (nodes.hasClass('group')) {
			this.addUngroupLink(nodes);
			this.information += "<br>";
		}

		this.addRenameLink(nodes);
	} else { // multiple selected nodes
		this.addGroupLink();
	}
	return this.information;
};

informationString.prototype.add = function(c1, c2) {
	if (c2 !== undefined) {
		c1 = c1.charAt(0).toUpperCase() + c1.slice(1); // make header uppercase
		this.information += "<tr>";
		this.information += "<th>" + c1 + "</th>";
		this.information += "<td>" + c2 + "</td>";
		this.information += "</tr>";
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
};

informationString.prototype.addRenameLink = function(node) {
	this.information += "<a href=\"#\" onclick=\"pvis.renameNode('" +
		node.data().id + "');\">Rename node</a>";
};

informationString.prototype.print = function() {
	return this.information;
};

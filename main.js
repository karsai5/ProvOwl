var g = new dagre.graphlib.Graph();

// Set an object for the graph label
g.setGraph({});

// Default to assigning a new object as a label for each new edge.
g.setDefaultEdgeLabel(function() { return {}; });

g.setNode("ajcsummary", { shape: "ellipse", class: "entity", label: "AJC-summary"});
g.setNode("advicereports", { shape: "ellipse", class: "entity", label: "advice-reports"});
g.setNode("report1", { shape: "ellipse", class: "entity", label: "report-1"});
g.setNode("report2", { shape: "ellipse", class: "entity", label: "report-2"});
g.setNode("abs", { class: "activity", label: "abs"});
g.setNode("analytics", { class: "activity", label: "analytics"});

g.setEdge("analytics", "ajcsummary", {label: "use"});
g.setEdge("report2", "abs", {label: "use"});
g.setEdge("report1", "analytics", {label: "gen"});
g.setEdge("abs", "report1", {label: "use"});
g.setEdge("abs", "report2", {label: "use"});
g.setEdge("advicereports", "abs", {label: "gen"});

g.graph().marginx = 20;
g.graph().marginy = 20;
g.graph().rankdir = 'BL';

dagre.layout(g);

$(document).ready(function() {
  var svg = d3.select("svg"),
  inner = d3.select("svg g");

  var render = dagreD3.render();
  d3.select("svg g").call(render, g);
});



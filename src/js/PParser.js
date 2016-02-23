/*jshint unused:false*/
/*jshint freeze:false*/
/*global w1*/
"use strict";

if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str) {
    if (this.substring(0, str.length) === str) {
      return true;
    }
    return false;
  };
}

function com() {
  this.comment = '//';
  this.prefix = 'prefix';
  this.entity = 'entity';
  this.activity = 'activity';
  this.used = 'used';
  this.generation = 'wasGeneratedBy';
  this.assocation = 'wasAssociatedWith';
  this.agent = 'agent';
  this.attributed = 'wasAttributedTo';
  this.derived = 'wasDerivedFrom';
  this.specialised = 'specializationOf';
  this.alternate = 'alternateOf';
  this.group = 'group';
  this.member = 'memberOf';
}

function prov() {
  this.prefixes = [];
  this.entities = [];
  this.activities = [];
  this.uses = [];
  this.associations = [];
  this.generations = [];
  this.derives = [];
  this.raw = null;
  this.alternates = [];
  this.agents = [];
  this.specialisations = [];
  this.groups = [];
  this.members = [];
  this.attributes = [];
  this.getPVisualiser = function() {
    var pvis = new PVisualiser();

    // Create entities
    $.each(this.entities, function (i,l) {
      var name = PParser.getLineArguments(l)[0];
      pvis.createEntity(name, PParser.removePrefix(name));
    });

    // Create agents
    $.each(this.agents, function (i,l) {
      var name = PParser.getLineArguments(l)[0];
      pvis.createAgent(name, PParser.removePrefix(name));
    });

    // Create activities
    $.each(this.activities, function (i,l) {
      var name = PParser.getLineArguments(l)[0];
      pvis.createActivity(name, PParser.removePrefix(name));
    });

    // Create uses
    $.each(this.uses, function (i,l) {
      var e1 = PParser.getLineArguments(l)[0];
      var e2 = PParser.getLineArguments(l)[1];
      pvis.used(e1, e2);
    });

    // Create generations
    $.each(this.generations, function (i,l) {
      var e1 = PParser.getLineArguments(l)[0];
      var e2 = PParser.getLineArguments(l)[1];
      pvis.wasGeneratedBy(e1, e2);
    });

    // Create associateions
    $.each(this.associations, function (i,l) {
      var e1 = PParser.getLineArguments(l)[0];
      var e2 = PParser.getLineArguments(l)[1];
      pvis.wasAssociatedWith(e1, e2);
    });

    // Create attributes
    $.each(this.attributes, function (i,l) {
      var e1 = PParser.getLineArguments(l)[0];
      var e2 = PParser.getLineArguments(l)[1];
      pvis.wasAttributedTo(e1, e2);
    });

    // Create derivations
    $.each(this.derives, function (i,l) {
      var e1 = PParser.getLineArguments(l)[0];
      var e2 = PParser.getLineArguments(l)[1];
      pvis.wasDerivedFrom(e1, e2);
    });

    // Create specialisations
    $.each(this.specialisations, function (i,l) {
      var e1 = PParser.getLineArguments(l)[0];
      var e2 = PParser.getLineArguments(l)[1];
      pvis.specialisationOf(e1, e2);
    });

    // Create alternates
    $.each(this.specialisations, function (i,l) {
      var e1 = PParser.getLineArguments(l)[0];
      var e2 = PParser.getLineArguments(l)[1];
      pvis.alternateOf(e1, e2);
    });

    // Create groups
    $.each(this.groups, function (i,l) {
      var name = PParser.getLineArguments(l)[0];
      pvis.createGroup(name);
    });

    // Link members to groups
    $.each(this.members, function (i,l) {
      var e1 = PParser.getLineArguments(l)[0];
      var e2 = PParser.getLineArguments(l)[1];
      console.log(e1 + " member of " + e2);
      pvis.memberOf(e1,e2);
    });

    return pvis;
  };
}

function PParser() {
  this.prov = new prov();
  this.com = new com;
};


// Helper Functions 
PParser.prototype.print = function(msg) {
  if (typeof w1 === 'undefined') {
    console.warn(msg);
  } else {
    w1.add(msg);
  }
};

PParser.getLineArguments = function(line) {
  line = line.substring(line.indexOf('(') + 1, line.lastIndexOf(')')).split(',');
  for (var i = 0; i < line.length; ++i) {
    line[i] = line[i].trim();
  }
  return line;
};

PParser.removePrefix = function(line) {
  return line.split(':')[1];
};

PParser.prototype.lineSwitcher = function(lineNum, line) {
  var com = this.com;
  var prov = this.prov;
  line = line.trim();
  if (line.startsWith(com.prefix)) {
    prov.prefixes.push(line);
  } else if (line.startsWith(com.entity)) {
    prov.entities.push(line);
  } else if (line.startsWith(com.activity)) {
    prov.activities.push(line);
  } else if (line.startsWith(com.used)) {
    prov.uses.push(line);
  } else if (line.startsWith(com.generation)) {
    prov.generations.push(line);
  } else if (line.startsWith(com.assocation)) {
    prov.associations.push(line);
  } else if (line.startsWith(com.agent)) {
    prov.agents.push(line);
  } else if (line.startsWith(com.attributed)) {
    prov.attributes.push(line);
  } else if (line.startsWith(com.derived)) {
    prov.derives.push(line);
  } else if (line.startsWith(com.specialised)) {
    prov.specialisations.push(line);
  } else if (line.startsWith(com.alternate)) {
    prov.alternates.push(line);
  } else if (line.startsWith(com.group)) {
    prov.groups.push(line);
  } else if (line.startsWith(com.member)) {
    prov.members.push(line);
  } else {
    if (line.length !== 0 && !line.startsWith(com.comment)) {
      this.print ("Unknown command" + "[" + lineNum + "] " + line);
    }
  }
};

PParser.prototype.parseFile = function(file, callback) {
  var request = $.get (file);

  request.success(function(result) {
    prov.raw = result; // add raw text to prov object
    var lines = result.split('\n');
    for (var i = 0; i < lines.length; ++i) {
      this.lineSwitcher(i, lines[i]);
    }
    callback(prov.getPVisualiser());
  });

  request.fail(function(jqXHR, textStatus, errorThrown) {
    if (errorThrown === "Not Found") {
      throw new Error("Can't parse file: File not found");
    } else {
      throw new Error("Can't parse file: " + errorThrown);
    }
  });
};

PParser.prototype.parseString = function(result, callback) {
  var lines = result.split('\n');
  for (var i = 0; i < lines.length; ++i) {
    this.lineSwitcher(i, lines[i]);
  }
  callback(this.prov.getPVisualiser());
};

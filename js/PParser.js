(function() {
  /*jshint unused:false*/
  /*jshint freeze:false*/
  "use strict";

  if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
      if (this.substring(0, str.length) === str) {
        return true;
      }
      return false;
    };
  }

  window.PParser = function() {

    // Provenance objects
    var prov = [];
    prov.prefixes = [];
    prov.entities = [];
    prov.activities = [];
    prov.uses = [];
    prov.associations = [];
    prov.generations = [];
    prov.derives = [];
    prov.raw = null;
    prov.alternates = [];
    prov.agents = [];
    prov.specialisations = [];
    prov.attributes = [];
    prov.getPVisualiser = function() {
      var pvis = new PVisualiser();

      // Create entities
      $.each(prov.entities, function (i,l) {
        var name = getLineArguments(l)[0];
        pvis.createEntity(name, removePrefix(name));
      });

      // Create agents
      $.each(prov.agents, function (i,l) {
        var name = getLineArguments(l)[0];
        pvis.createAgent(name, removePrefix(name));
      });

      // Create activities
      $.each(prov.activities, function (i,l) {
        var name = getLineArguments(l)[0];
        pvis.createActivity(name, removePrefix(name));
      });

      // Create uses
      $.each(prov.uses, function (i,l) {
        var e1 = getLineArguments(l)[0];
        var e2 = getLineArguments(l)[1];
        pvis.used(e1, e2);
      });

      // Create generations
      $.each(prov.generations, function (i,l) {
        var e1 = getLineArguments(l)[0];
        var e2 = getLineArguments(l)[1];
        pvis.wasGeneratedBy(e1, e2);
      });

      // Create associateions
      $.each(prov.associations, function (i,l) {
        var e1 = getLineArguments(l)[0];
        var e2 = getLineArguments(l)[1];
        pvis.wasAssociatedWith(e1, e2);
      });

      // Create attributes
      $.each(prov.attributes, function (i,l) {
        var e1 = getLineArguments(l)[0];
        var e2 = getLineArguments(l)[1];
        pvis.wasAttributedTo(e1, e2);
      });

      // Create derivations
      $.each(prov.derives, function (i,l) {
        var e1 = getLineArguments(l)[0];
        var e2 = getLineArguments(l)[1];
        pvis.wasDerivedFrom(e1, e2);
      });

      // Create specialisations
      $.each(prov.specialisations, function (i,l) {
        var e1 = getLineArguments(l)[0];
        var e2 = getLineArguments(l)[1];
        pvis.specialisationOf(e1, e2);
      });

      // Create alternates
      $.each(prov.specialisations, function (i,l) {
        var e1 = getLineArguments(l)[0];
        var e2 = getLineArguments(l)[1];
        pvis.alternateOf(e1, e2);
      });

      return pvis;
    };

    // Commands
    var com = [];
    com.comment = '//';
    com.prefix = 'prefix';
    com.entity = 'entity';
    com.activity = 'activity';
    com.used = 'used';
    com.generation = 'wasGeneratedBy';
    com.assocation = 'wasAssociatedWith';
    com.agent = 'agent';
    com.attributed = 'wasAttributedTo';
    com.derived = 'wasDerivedFrom';
    com.specialised = 'specializationOf';
    com.alternate = 'alternateOf';

    // Helper Functions 
    var getLineArguments = function(line) {
      line = line.substring(line.indexOf('(') + 1, line.lastIndexOf(')')).split(',');
      for (var i = 0; i < line.length; ++i) {
        line[i] = line[i].trim();
      }
      return line;
    };

    var removePrefix = function(line) {
      return line.split(':')[1];
    };

    var lineSwitcher = function(lineNum, line) {
      line = line.trim();
      if (line.length === 0) {
        // console.log(lineNum + ": empty line");
      } else if (line.startsWith(com.comment)) {
        // console.log(lineNum + ": comment");
      } else if (line.startsWith(com.prefix)) {
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
      } else {
        w1.add("Unknown command", "[" + lineNum + "] " + line);
      }
    };

    this.parseFile = function(file, callback) {
      var request = $.get (file);

      request.success(function(result) {
        prov.raw = result; // add raw text to prov object
        var lines = result.split('\n');
        for (var i = 0; i < lines.length; ++i) {
          lineSwitcher(i, lines[i]);
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

    this.parseString = function(result, callback) {
      var lines = result.split('\n');
      for (var i = 0; i < lines.length; ++i) {
        lineSwitcher(i, lines[i]);
      }
      callback(prov.getPVisualiser());
    };
  };
}());

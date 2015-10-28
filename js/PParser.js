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
    prov.generations = [];
    prov.raw = null;

    // Commands
    var com = [];
    com.comment = '//';
    com.prefix = 'prefix';
    com.entity = 'entity';
    com.activity = 'activity';
    com.used = 'used';
    com.generation = 'wasGeneratedBy';

    var lineSwitcher = function(lineNum, line) {
      line = line.trim();
      if (line.length === 0) {
        console.log(lineNum + ": empty line");
      } else if (line.startsWith(com.comment)) {
        console.log(lineNum + ": comment");
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
      } else {
        console.log(lineNum + ": Unknown command (" + line + ")");
      }
    };

    this.parse = function(file) {
      var request = $.get (file);

      request.success(function(result) {
        prov.raw = result; // add raw text to prov object
        var lines = result.split('\n');
        for (var i = 0; i < lines.length; ++i) {
          lineSwitcher(i, lines[i]);
        }
        console.log(prov);
        return prov.getGraph();
      });

      request.fail(function(jqXHR, textStatus, errorThrown) {
        if (errorThrown === "Not Found") {
          throw new Error("Can't parse file: File not found");
        } else {
          throw new Error("Can't parse file: " + errorThrown);
        }
      });
    };
  };
}());

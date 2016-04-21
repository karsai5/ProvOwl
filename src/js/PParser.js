/**
 * @fileOverview Contains all the classes and functions related to parsing the
 * provenance standard.
 * jshint unused:false
 * jshint freeze:false
 * global w1
 */
"use strict";

if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function(str) {
        if (this.substring(0, str.length) === str) {
            return true;
        }
        return false;
    };
}

/**
 * This commands class is a list of commands that can be used in a prov file as 
 * as well as the associated string.
 * @constructor
 */
function Commands() {
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
    this.acted = 'actedOnBehalfOf';
}

/**
 * The Prov class is basically the provenance file/string in JavaScript object
 * form. It adds all the strings associated with uses, agents, nodes into 
 * relavent lists.
 * @constructor
 */
function Provenance() {
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
    this.acted = [];
    this.attributes = [];

    /**
     * Once all the relevant lines have been read from the prov file into a prov
     * object, this function will create a {@link PVisualiser} object with all the
     * correct edges and nodes
     * @return {object} The {@link PVisualiser} object
     */
    this.getPVisualiser = function() {
        var pvis = new PVisualiser();

        // Create entities
        $.each(this.entities, function(i, l) {
            var name = PParser.getLineArguments(l)[0];
            pvis.createEntity(name, PParser.removePrefix(name));
        });

        // Create agents
        $.each(this.agents, function(i, l) {
            var name = PParser.getLineArguments(l)[0];
            pvis.createAgent(name, PParser.removePrefix(name));
        });

        // Create activities
        $.each(this.activities, function(i, l) {
            var name = PParser.getLineArguments(l)[0];
            pvis.createActivity(name, PParser.removePrefix(name));
        });

        // Create uses
        $.each(this.uses, function(i, l) {
            var e1 = PParser.getLineArguments(l)[0];
            var e2 = PParser.getLineArguments(l)[1];
            pvis.used(e1, e2);
        });

        // Create generations
        $.each(this.generations, function(i, l) {
            var e1 = PParser.getLineArguments(l)[0];
            var e2 = PParser.getLineArguments(l)[1];
            pvis.wasGeneratedBy(e1, e2);
        });

        // Create associateions
        $.each(this.associations, function(i, l) {
            var e1 = PParser.getLineArguments(l)[0];
            var e2 = PParser.getLineArguments(l)[1];
            pvis.wasAssociatedWith(e1, e2);
        });

        // Create attributes
        $.each(this.attributes, function(i, l) {
            var e1 = PParser.getLineArguments(l)[0];
            var e2 = PParser.getLineArguments(l)[1];
            pvis.wasAttributedTo(e1, e2);
        });

        // Create derivations
        $.each(this.derives, function(i, l) {
            var e1 = PParser.getLineArguments(l)[0];
            var e2 = PParser.getLineArguments(l)[1];
            pvis.wasDerivedFrom(e1, e2);
        });

        // Create specialisations
        $.each(this.specialisations, function(i, l) {
            var e1 = PParser.getLineArguments(l)[0];
            var e2 = PParser.getLineArguments(l)[1];
            pvis.specialisationOf(e1, e2);
        });

        // Create alternates
        $.each(this.specialisations, function(i, l) {
            var e1 = PParser.getLineArguments(l)[0];
            var e2 = PParser.getLineArguments(l)[1];
            pvis.alternateOf(e1, e2);
        });
        //
        // Create alternates
        $.each(this.acted, function(i, l) {
            var e1 = PParser.getLineArguments(l)[0];
            var e2 = PParser.getLineArguments(l)[1];
            pvis.actedOnBehalfOf(e1, e2);
        });

        // Create groups
        $.each(this.groups, function(i, l) {
            var name = PParser.getLineArguments(l)[0];
            pvis.createGroup(name);
        });

        // Link members to groups
        $.each(this.members, function(i, l) {
            var e1 = PParser.getLineArguments(l)[0];
            var e2 = PParser.getLineArguments(l)[1];
            console.log(e1 + " member of " + e2);
            pvis.memberOf(e1, e2);
        });

        return pvis;
    };
}

/**
 * The provenance parser's main purpose is to read and correctly parse
 * a provenance string or file.
 * @constructor
 */
function PParser() {
    this.prov = new Provenance();
    this.com = new Commands;
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
    } else if (line.startsWith(com.acted)) {
        prov.acted.push(line);
    } else if (line.startsWith(com.group)) {
        prov.groups.push(line);
    } else if (line.startsWith(com.member)) {
        prov.members.push(line);
    } else {
        if (line.length !== 0 && !line.startsWith(com.comment)) {
            this.print("Unknown command" + "[" + lineNum + "] " + line);
        }
    }
};

/**
 * Load a file and get the {@link PVisualiser} object. Will throw an error if 
 * it can't find the file.
 * @param {string} file The url to the file.
 * @param {function} callback A function to callback after the visualiser has
 * been created. It will be parsed the PVisualiser object.
 */
PParser.prototype.parseFile = function(file, callback) {
    var request = $.get(file);
    var that = this;

    request.success(function(result) {
        // this.prov.raw = result; // add raw text to prov object
        var lines = result.split('\n');
        for (var i = 0; i < lines.length; ++i) {
            that.lineSwitcher(i, lines[i]);
        }
        callback(that.prov.getPVisualiser());
    });

    request.fail(function(jqXHR, textStatus, errorThrown) {
        if (errorThrown === "Not Found") {
            throw new Error("Can't parse file: File not found");
        } else {
            throw new Error("Can't parse file: " + errorThrown);
        }
    });
};

/**
 * Parse a string of the prov standard, breaking on new lines "\n". 
 * @param {string} result The prov file in string format.
 * @return {PVisualiser} The Pvisualiser object with added nodes/edges.
 */
PParser.prototype.parseString = function(result, callback) {
    var lines = result.split('\n');
    for (var i = 0; i < lines.length; ++i) {
        this.lineSwitcher(i, lines[i]);
    }
    return this.prov.getPVisualiser();
};
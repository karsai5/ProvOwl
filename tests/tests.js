/* Jshint options */
/* globals stop, start, PParser */
(function() {
  "use strict";
  var p; // variable for visualiser
  var parser;

  QUnit.module("Entities",{
    beforeEach: function() {
      p = new PVisualiser();
    }
  });

  QUnit.test( "Incorrect arguments", function (assert) {
    var count = p.nodeCount();
    assert.throws(
        function() {
          p.createEntity(1, 'Entity1-label');
        },
        /Unexpected Variable/,
        "First variable is a number"
        );
    assert.throws(
        function() {
          p.createEntity('Entity1', 1);
        },
        /Unexpected Variable/,
        "Second variable a number"
        );
    assert.throws(
        function() {
          p.createEntity();
        },
        /Unexpected Variable/,
        "No arguments"
        );
    assert.throws(
        function() {
          p.createEntity('Entity1');
        },
        /Unexpected Variable/,
        "Only one argument"
        );
    assert.strictEqual(p.nodeCount(), count, "No entities added");
  });

  QUnit.test("Succesfully create entity", function (assert) {
    var count = p.nodeCount();
    assert.ok(p.createEntity('Entity1-id', 'Entity1-label'), "Returns True");
    assert.strictEqual(p.nodeCount(), count + 1, "Entity added");
    assert.throws(
        function() {
          p.createEntity('Entity1-id', 'Entity1-label')
        },
        /ID already exists/,
        "Add second entity with same ID"
        );
  });

  QUnit.module("Activities",{
    beforeEach: function() {
      p = new PVisualiser('svg g');
    }
  });

  QUnit.test( "Incorrect arguments", function (assert) {
    var count = p.nodeCount();
    assert.throws(
        function() {
          p.createActivity(1, 'Activity1-label');
        },
        /Unexpected Variable/,
        "First variable is a number"
        );
    assert.throws(
        function() {
          p.createActivity('Activity1', 1);
        },
        /Unexpected Variable/,
        "Second variable a number"
        );
    assert.throws(
        function() {
          p.createActivity();
        },
        /Unexpected Variable/,
        "No arguments"
        );
    assert.throws(
        function() {
          p.createActivity('Activity1');
        },
        /Unexpected Variable/,
        "Only one argument"
        );
    assert.strictEqual(p.nodeCount(), count, "No activities added");
  });

  QUnit.test("Succesfully create activity", function (assert) {
    var count = p.nodeCount();
    assert.ok(p.createActivity('Activity1-id', 'Activity1-label'), "Returns True");
    assert.strictEqual(p.nodeCount(), count + 1, "Activity added");
    assert.throws(
        function() {
          p.createActivity('Activity1-id', 'Activity1-label');
        },
        /ID already exists/,
        "Add second activity with same ID"
        );
  });

  QUnit.module("Generation",{
    beforeEach: function() {
      p = new PVisualiser('svg g');
      p.createEntity('entity1', 'Entity 1');
      p.createEntity('entity2', 'Entity 2');
    }
  });

  QUnit.test( "Incorrect arguments", function (assert) {
    var count = p.edgeCount();
    assert.throws(
        function() {
          p.generated(1, 'entity1');
        },
        /Unexpected Variable/,
        "First variable is a number"
        );
    assert.throws(
        function() {
          p.generated('entity1', 1);
        },
        /Unexpected Variable/,
        "Second variable a number"
        );
    assert.throws(
        function() {
          p.generated();
        },
        /Unexpected Variable/,
        "No arguments"
        );
    assert.throws(
        function() {
          p.generated('entity1');
        },
        /Unexpected Variable/,
        "Only one argument"
        );
    assert.strictEqual(p.edgeCount(), count, "No generations added");
  });

  QUnit.test( "Generating non-exsiting entities", function (assert) {
    var count = p.edgeCount();
    assert.throws(
        function() {
          p.generated('entity1','unreal-entity');
        },
        /Nonexistent/,
        "Nonexistent entity"
        );
    assert.throws(
        function() {
          p.generated('unreal-entity','entity1');
        },
        /Nonexistent/,
        "Nonexistent entity"
        );
    assert.strictEqual(p.edgeCount(), count, "No generation edges added");
  });

  QUnit.test( "Sucesfully create generation edge", function (assert) {
    var count = p.edgeCount();
    assert.ok(p.generated('entity1', 'entity2'), "Returns True");
    assert.strictEqual(p.edgeCount(), count + 1, "Generation edge added");
  });

  QUnit.module("Used",{
    beforeEach: function() {
      p = new PVisualiser('svg g');
      p.createEntity('entity1', 'Entity 1');
      p.createEntity('entity2', 'Entity 2');
    }
  });

  QUnit.test( "Incorrect arguments", function (assert) {
    var count = p.edgeCount();
    assert.throws(
        function() {
          p.used(1, 'entity1');
        },
        /Unexpected Variable/,
        "First variable is a number"
        );
    assert.throws(
        function() {
          p.used('entity1', 1);
        },
        /Unexpected Variable/,
        "Second variable a number"
        );
    assert.throws(
        function() {
          p.used();
        },
        /Unexpected Variable/,
        "No arguments"
        );
    assert.throws(
        function() {
          p.used('entity1');
        },
        /Unexpected Variable/,
        "Only one argument"
        );
    assert.strictEqual(p.edgeCount(), count, "No used edges added");
  });

  QUnit.test( "Generating non-exsiting entities", function (assert) {
    var count = p.edgeCount();
    assert.throws(
        function() {
          p.used('entity1','unreal-entity');
        },
        /Nonexistent/,
        "Nonexistent entity"
        );
    assert.throws(
        function() {
          p.used('unreal-entity','entity1');
        },
        /Nonexistent/,
        "Nonexistent entity"
        );
    assert.strictEqual(p.edgeCount(), count, "No use edges added");
  });

  QUnit.test( "Sucesfully create use edge", function (assert) {
    var count = p.edgeCount();
    assert.ok(p.used('entity1', 'entity2'), "Returns True");
    assert.strictEqual(p.edgeCount(), count + 1, "Use edge added");
  });

  QUnit.module("Manual Graphs",{
    beforeEach: function() {
      p = new PVisualiser();
      $.ajaxSetup({
        // Disable caching of AJAX responses
        cache: false
      });
      $("#cy").html("");
    }
  });

  QUnit.test( "IR-fragment-for-abstraction-example-4", function (assert) {
    assert.strictEqual($("#cy").children().length, 0, "No ouput graph");
    p.createEntity('ajcsummary', 'AJC-summary');
    p.createEntity('advicereports', 'Advice Reports');
    p.createEntity('report1', 'Report 1');
    p.createEntity('report2', 'Report 2');
    p.createActivity('abs', 'ABS');
    p.createActivity('analytics', 'Analytics');

    p.generated('report1', 'analytics');
    p.generated('advicereports', 'abs');

    p.used('analytics', 'ajcsummary');
    p.used('report2', 'abs');
    p.used('abs', 'report1');
    p.used('abs', 'report2');

    p.render('#cy', function() {
      assert.notStrictEqual($("#cy").children().length, 0, "Graph outputted");
    });
    // assert.strictEqual($('svg > g > g.output').length, 1, "Output graph generated");
  });

  QUnit.module("Prov Parser",{
    beforeEach: function() {
      $("#cy").html("");
      p = new PVisualiser();
      parser = new PParser();
      $.ajaxSetup({
        // Disable caching of AJAX responses
        cache: false,
        async: false
      });
    }
  });

  QUnit.test("Load nonexistent prov file", function (assert) {
    assert.expect(1);
    assert.throws(
        function() {
          parser.parseFile('Nonexistent.prov');
        },
        /File not found/,
        "Parse nonexistent prov file"
        );
  });

  // TODO: Check that graph was created.
  QUnit.test( "IR-fragment-for-abstraction-example-4", function (assert) {
    function renderCallback() {
    }
    function renderProv(p2) {
      p2.render('#cy', renderCallback());

    }
    assert.strictEqual($("#cy").children().length, 0, "No ouput graph");
    parser.parseFile('/tests/IR-fragment-for-abstraction-example-4.provn', renderProv);

    // $.get ("tests/IR-fragment-for-absctraction-example-4.html", function(data) {
    //   assert.strictEqual($('svg > g').html().replace(/\s+/g, ''), data.replace(/\s+/g, ''), "Graph identical to stored graph");
    //   start();
    // });
  });
}());

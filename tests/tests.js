/* Jshint options */
/* globals PParser */
(function() {
  "use strict";
  var p; // variable for visualiser
  var parser;

  QUnit.module("Graph",{
    beforeEach: function() {
      p = new PVisualiser();
      p.createEntity('entity1', 'Entity 1');
      p.createEntity('entity2', 'Entity 2');
    }
  });

  QUnit.test( "Nodes", function (assert) {
    var count = p.nodeCount();
    assert.notOk(p.addNode(1, 'Entity1-label', 'entity'), "First variable a number");
    assert.notOk(p.addNode('Entity1-label', 1, 'entity'), "Second variable a number");
    assert.notOk(p.addNode(), "No arguments", 'entity');
    assert.notOk(p.addNode(), "Only one argument", 'entity');
    assert.strictEqual(p.nodeCount(), count, "Check no nodes added");
    count = p.nodeCount();
    assert.ok(p.createEntity('Entity1-id', 'Entity1-label'), "Create entity");
    assert.strictEqual(p.nodeCount(), count + 1, "Check entity added");
    assert.notOk(p.createEntity('Entity1-id', 'Entity1-label'), "Wont make entity with same ID");
  });

  QUnit.test( "Edges", function (assert) {
    var count = p.edgeCount();
    assert.notOk(p.wasGeneratedBy(1, 'entity1'), 'First variable is a number');
    assert.notOk(p.wasGeneratedBy('entity1', 2), 'Second variable is a number');
    assert.notOk(p.wasGeneratedBy(), 'No arguments');
    assert.notOk(p.wasGeneratedBy('entity1'), 'One argument');
    assert.strictEqual(p.edgeCount(), count, "Checking no generations added");

    count = p.edgeCount();
    assert.notOk(p.addEdge('entity1', 'unreal-entity'), 'Connent nonexistent node');
    assert.notOk(p.addEdge('unreal-entity', 'entity1'), 'Connent nonexistent node');
    assert.strictEqual(p.edgeCount(), count, "No generation edges added");

    count = p.edgeCount();
    assert.ok(p.wasGeneratedBy('entity1', 'entity2'), "Add generated edge");
    assert.strictEqual(p.edgeCount(), count + 1, "Generation edge added!");
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

    p.wasGeneratedBy('report1', 'analytics');
    p.wasGeneratedBy('advicereports', 'abs');

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

QUnit.module("Entities",{
  beforeEach: function() {
    p = new PVisualiser('svg g');
  }
});

QUnit.test( "Incorrect arguments", function (assert) {
  count = p.getGraph().nodeCount();
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
  assert.strictEqual(p.getGraph().nodeCount(), count, "No entities added");
});

QUnit.test("Succesfully create entity", function (assert) {
  count = p.getGraph().nodeCount();
  assert.ok(p.createEntity('Entity1-id', 'Entity1-label'), "Returns True");
  assert.strictEqual(p.getGraph().nodeCount(), count + 1, "Activity added");
});

QUnit.module("Activities",{
  beforeEach: function() {
    p = new PVisualiser('svg g');
  }
});

QUnit.test( "Incorrect arguments", function (assert) {
  count = p.getGraph().nodeCount();
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
  assert.strictEqual(p.getGraph().nodeCount(), count, "No activities added");
});

QUnit.test("Succesfully create activity", function (assert) {
  count = p.getGraph().nodeCount();
  assert.ok(p.createActivity('Activity1-id', 'Activity1-label'), "Returns True");
  assert.strictEqual(p.getGraph().nodeCount(), count + 1, "Activity added");
});

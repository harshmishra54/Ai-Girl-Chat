const test = require("node:test");
const assert = require("node:assert/strict");
const { classifySignal, nextIntimacyLevel, relationshipStage } = require("../utils/conversationState");

test("stop and slow signals take priority over escalation", () => {
  assert.equal(classifySignal("stop, no more"), "stop");
  assert.equal(classifySignal("please slow down"), "slow");
  assert.equal(nextIntimacyLevel(5, "stop"), 0);
  assert.equal(nextIntimacyLevel(5, "slow"), 3);
});

test("clear reciprocation escalates gradually and remains bounded", () => {
  assert.equal(classifySignal("yes please, keep going"), "reciprocate");
  assert.equal(classifySignal("don't stop"), "reciprocate");
  assert.equal(nextIntimacyLevel(2, "reciprocate"), 3);
  assert.equal(nextIntimacyLevel(5, "reciprocate"), 5);
});

test("relationship stages derive from real message counts", () => {
  assert.equal(relationshipStage(0), "new");
  assert.equal(relationshipStage(5), "flirty");
  assert.equal(relationshipStage(20), "comfortable");
  assert.equal(relationshipStage(50), "intimate");
  assert.equal(relationshipStage(100), "deeply-familiar");
});

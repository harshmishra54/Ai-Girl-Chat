const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateExpiry, getEffectiveExpiry, getPlan, hasActiveSubscription } = require("../utils/subscription");

test("recognizes every supported plan", () => {
  assert.equal(getPlan(20).label, "1 Day");
  assert.equal(getPlan("59").label, "7 Days");
  assert.equal(getPlan(99).label, "30 Days");
  assert.equal(getPlan(10), null);
});

test("new subscriptions start from payment time", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  assert.equal(calculateExpiry(20, null, now).toISOString(), "2026-01-02T00:00:00.000Z");
});

test("renewals extend an existing active subscription", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const currentExpiry = new Date("2026-01-05T00:00:00.000Z");
  assert.equal(calculateExpiry(59, currentExpiry, now).toISOString(), "2026-01-12T00:00:00.000Z");
});

test("legacy users receive an effective expiry", () => {
  const user = { paymentVerified: true, paymentAmount: 59, paymentVerifiedAt: new Date("2026-01-01T00:00:00.000Z") };
  assert.equal(getEffectiveExpiry(user).toISOString(), "2026-01-08T00:00:00.000Z");
  assert.equal(hasActiveSubscription(user, new Date("2026-01-07T00:00:00.000Z")), true);
  assert.equal(hasActiveSubscription(user, new Date("2026-01-09T00:00:00.000Z")), false);
});

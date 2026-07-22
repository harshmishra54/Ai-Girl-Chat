const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { getCapturedPayment, verifyWebhookSignature } = require("../utils/razorpayWebhook");

test("verifies a valid Razorpay signature", () => {
  const body = Buffer.from('{"event":"payment.captured"}');
  const secret = "test-secret";
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyWebhookSignature(body, signature, secret), true);
  assert.equal(verifyWebhookSignature(body, "bad-signature", secret), false);
});

test("extracts only captured payments", () => {
  const payment = { id: "pay_123" };
  assert.deepEqual(getCapturedPayment({ event: "payment.captured", payload: { payment: { entity: payment } } }), payment);
  assert.equal(getCapturedPayment({ event: "payment.failed" }), null);
});

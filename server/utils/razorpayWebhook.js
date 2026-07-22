const crypto = require("crypto");

function verifyWebhookSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const actualBuffer = Buffer.from(String(signature), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function getCapturedPayment(payload) {
  if (payload?.event !== "payment.captured") return null;
  return payload?.payload?.payment?.entity || null;
}

module.exports = { verifyWebhookSignature, getCapturedPayment };

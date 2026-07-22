const PLANS = Object.freeze({
  20: { amount: 20, label: "1 Day", durationMs: 24 * 60 * 60 * 1000 },
  59: { amount: 59, label: "7 Days", durationMs: 7 * 24 * 60 * 60 * 1000 },
  99: { amount: 99, label: "30 Days", durationMs: 30 * 24 * 60 * 60 * 1000 },
});

function getPlan(amount) {
  const normalized = Number(amount);
  return PLANS[normalized] || null;
}

function calculateExpiry(amount, currentExpiry, now = new Date()) {
  const plan = getPlan(amount);
  if (!plan) throw new Error(`Unsupported payment amount: ${amount}`);
  const existing = currentExpiry ? new Date(currentExpiry) : null;
  const startsAt = existing && existing > now ? existing : now;
  return new Date(startsAt.getTime() + plan.durationMs);
}

function getEffectiveExpiry(user) {
  if (user?.planExpiresAt) return new Date(user.planExpiresAt);
  const plan = getPlan(user?.paymentAmount);
  if (!plan || !user?.paymentVerifiedAt) return null;
  return new Date(new Date(user.paymentVerifiedAt).getTime() + plan.durationMs);
}

function hasActiveSubscription(user, now = new Date()) {
  const expiry = getEffectiveExpiry(user);
  return Boolean(user?.paymentVerified && expiry && expiry > now);
}

function formatExpiry(date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

module.exports = { PLANS, getPlan, calculateExpiry, getEffectiveExpiry, hasActiveSubscription, formatExpiry };

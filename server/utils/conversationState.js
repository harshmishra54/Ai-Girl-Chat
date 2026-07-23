const STAGES = [
  { minimum: 100, stage: "deeply-familiar" },
  { minimum: 50, stage: "intimate" },
  { minimum: 20, stage: "comfortable" },
  { minimum: 5, stage: "flirty" },
  { minimum: 0, stage: "new" },
];

const STOP_PATTERNS = [
  /\bstop\b/i,
  /\bno more\b/i,
  /\bdon'?t\b/i,
  /\bbas karo\b/i,
  /\bruko\b/i,
  /\bband karo\b/i,
];

const SLOW_PATTERNS = [
  /\bslow(?:er)?\b/i,
  /\bnot so fast\b/i,
  /\btoo much\b/i,
  /\bdheere\b/i,
  /\baaram se\b/i,
];

const RECIPROCATION_PATTERNS = [
  /\bcontinue\b/i,
  /\bmore\b/i,
  /\byes\b/i,
  /\bplease\b/i,
  /\bcome on\b/i,
  /\bkeep going\b/i,
  /\baur\b/i,
  /\bhaan\b/i,
  /\bchahiye\b/i,
  /\bdo it\b/i,
  /\bturn(?:ed)? on\b/i,
  /\bhorny\b/i,
];

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(String(text || "")));
}

function classifySignal(text) {
  if (/\bdon'?t stop\b/i.test(String(text || ""))) return "reciprocate";
  if (matchesAny(text, STOP_PATTERNS)) return "stop";
  if (matchesAny(text, SLOW_PATTERNS)) return "slow";
  if (matchesAny(text, RECIPROCATION_PATTERNS)) return "reciprocate";
  return "neutral";
}

function nextIntimacyLevel(currentLevel, signal) {
  const current = Math.max(0, Math.min(5, Number(currentLevel) || 0));
  if (signal === "stop") return 0;
  if (signal === "slow") return Math.max(0, current - 2);
  if (signal === "reciprocate") return Math.min(5, current + 1);
  return current;
}

function relationshipStage(messageCount) {
  const count = Math.max(0, Number(messageCount) || 0);
  return STAGES.find(({ minimum }) => count >= minimum).stage;
}

module.exports = { classifySignal, nextIntimacyLevel, relationshipStage };

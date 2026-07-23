const test = require("node:test");
const assert = require("node:assert/strict");
const { buildMessages, buildSystemPrompt, postWithRetry } = require("../utils/chatHandler");

test("prompt includes control, consent, limits, and user preferences", () => {
  const prompt = buildSystemPrompt({
    name: "Sam",
    flirtLevel: "spicy",
    dominanceLevel: "dominant",
    dominanceConsentAt: new Date(),
    intimacyLevel: 4,
    relationshipStage: "intimate",
    preferredTerms: ["term one"],
    preferredFantasy: "saved fantasy",
    hardLimits: ["hard boundary"],
    softLimits: ["soft boundary"],
    languagePreference: "english",
    messageLengthPreference: "medium",
    preferredPetName: "favorite",
    aftercareEnabled: true,
  });

  for (const expected of [
    "Current intimacy is 4/5",
    'control style is "dominant"',
    "Dominance consent recorded: true",
    "hard boundary",
    "soft boundary",
    "Language preference: english",
    "Reply-length preference: medium",
    "Preferred pet name: favorite",
  ]) {
    assert.match(prompt, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("recent history remains structured and bounded", () => {
  const history = Array.from({ length: 20 }, (_, index) => ({
    message: `user ${index}`,
    response: `assistant ${index}`,
  }));
  const messages = buildMessages("latest", {}, history);
  assert.equal(messages.length, 34);
  assert.equal(messages[1].content, "user 4");
  assert.equal(messages.at(-1).content, "latest");
});

test("OpenRouter retries temporary failures and honors retry-after", async () => {
  let attempts = 0;
  const delays = [];
  const client = {
    post: async () => {
      attempts += 1;
      if (attempts < 3) {
        const error = new Error("temporary");
        error.response = { status: 429, headers: { "retry-after": "1" } };
        throw error;
      }
      return { data: { choices: [{ message: { content: "ok" } }] } };
    },
  };
  const response = await postWithRetry({}, {}, {
    client,
    waitFn: async (delay) => delays.push(delay),
  });
  assert.equal(response.data.choices[0].message.content, "ok");
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [1000, 1000]);
});

test("OpenRouter does not retry permanent failures", async () => {
  let attempts = 0;
  const client = {
    post: async () => {
      attempts += 1;
      const error = new Error("unauthorized");
      error.response = { status: 401 };
      throw error;
    },
  };
  await assert.rejects(() => postWithRetry({}, {}, { client, waitFn: async () => {} }), /unauthorized/);
  assert.equal(attempts, 1);
});

const fetch = require("node-fetch");
const nsfwMap = require("./nsfwManualMap");

async function translate(text, from = "auto", to = "en") {
  const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
  const data = await res.json();
  return data.responseData.translatedText;
}

function applyNSFWMap(text) {
  let result = text.toLowerCase();
  for (const [eng, roman] of Object.entries(nsfwMap)) {
    const regex = new RegExp(`\\b${eng}\\b`, "gi");
    result = result.replace(regex, roman);
  }
  return result;
}

module.exports = async function translateWithNSFW(text, direction = "en2hn") {
  if (direction === "hi2en") {
    return applyNSFWMap(await translate(text, "auto", "en"));
  } else {
    let english = await translate(text, "auto", "en");
    let roman = applyNSFWMap(await translate(english, "en", "hi"));
    return roman.replace(/[\u0900-\u097F]/g, ""); // remove devnagri
  }
};

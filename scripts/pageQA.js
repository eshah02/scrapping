import "dotenv/config";
import fs from "fs-extra";
import { askGemini } from "../llm/geminiClient.js";

const sleep = ms => new Promise(r => setTimeout(r, ms));
const cleanText = t => t.replace(/\s+/g, " ").slice(0, 4000);
const is429 = e => e?.response?.status === 429;

async function main() {
  const pages = await fs.readJson("data/resend_data.json");

  let results = [];
  if (await fs.pathExists("data/page_qa.json")) {
    results = await fs.readJson("data/page_qa.json");
  }

  const done = new Set(results.map(r => r.url));

  console.log(" Initial cooldown 2 minutes...");
  await sleep(120000);

  for (const page of pages) {
    if (done.has(page.url)) {
      console.log("Skipping:", page.url);
      continue;
    }

    console.log("\nAsking LLM for:", page.url);

    const prompt = `
PAGE:
${page.url}

CONTENT:
${cleanText(page.text)}

TASK:
Summarize + 5 Q&A
`;

    let attempts = 0;
    let success = false;

    while (!success && attempts < 3) {
      try {
        const answer = await askGemini(prompt);

        results.push({ url: page.url, qa: answer });

        await fs.writeJson("data/page_qa.json", results, { spaces: 2 });

        console.log("Saved:", page.url);
        success = true;

        await sleep(60000); 
      } catch (err) {
        attempts++;

        if (is429(err)) {
          console.warn(
            `429 (${attempts}/3). Waiting 2 minutes then retry`
          );
          await sleep(120000);
        } else {
          console.error("Error:", err.message);
          break;
        }
      }
    }

    if (!success) {
      console.warn("Skipping page due to repeated 429:", page.url);
    }
  }

  console.log("Finished processing.");
}

main();

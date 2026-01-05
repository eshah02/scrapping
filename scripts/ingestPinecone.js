import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getIndex } from "../pinecone/client.js";
import { embedText } from "../llm/geminiClient.js";

const INDEX_NAME = "resend-rag";
const DATA_PATH = path.resolve("data/page_qa.json");
const BATCH_SIZE = 10; 

function hashId(input) {
  return crypto.createHash("md5").update(input).digest("hex");
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function ingest() {
  console.log(" Reading data...");
  const pages = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

  const index = getIndex(INDEX_NAME);
  let vectors = [];

  for (const page of pages) {
    if (!page.text || page.text.length < 100) continue;

    console.log("Embedding:", page.url);

    const embedding = await embedText(page.text);

    vectors.push({
      id: hashId(page.url),
      values: embedding,
      metadata: {
        url: page.url,
        title: page.title || "",
        text: page.text.slice(0, 2000),
      },
    });

    if (vectors.length >= BATCH_SIZE) {
      await index.upsert(vectors);
      console.log(`Upserted ${vectors.length}`);
      vectors = [];
      await sleep(1500); 
    }
  }

  if (vectors.length) {
    await index.upsert(vectors);
    console.log(`Upserted ${vectors.length}`);
  }

  console.log("Pinecone ingestion DONE");
}

ingest().catch((err) => {
  console.error("Ingestion failed:", err.message);
  process.exit(1);
});

import "dotenv/config";
import fs from "fs-extra";
import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getIndex } from "../pinecone/client.js";

if (!process.env.GOOGLE_API_KEY) throw new Error("Missing GOOGLE_API_KEY");
const SITEMAP_URL = "https://resend.com/sitemap.xml";
const DATA_DIR = "data";
const RESEND_JSON = `${DATA_DIR}/resend_data.json`;
const PAGE_QA_JSON = `${DATA_DIR}/page_qa.json`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const qaModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});
async function fetchSitemap() {
  const { data } = await axios.get(SITEMAP_URL);
  const $ = cheerio.load(data, { xmlMode: true });

  return $("url > loc")
    .map((_, el) => $(el).text())
    .get()
    .slice(0, 20); 
}

async function extractPageContent(url) {
  const { data } = await axios.get(url, { timeout: 30000 });
  const $ = cheerio.load(data);

  $("script, style, nav, footer, header").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

async function generateQAWithGemini(text) {
  const prompt = `
Summarize the content below.
Then generate EXACTLY 5 high-quality Q&A pairs.

CONTENT:
${text.slice(0, 12000)}
`;

  const res = await qaModel.generateContent(prompt);
  return res.response.text();
}

async function generateEmbeddings(qaText) {
  const clean = qaText.replace(/\s+/g, " ").slice(0, 8000);
  const result = await embeddingModel.embedContent(clean);
  return result.embedding.values;
}

async function upsertToPinecone(url, embedding, qaText) {
  const index = getIndex();

  await index.upsert([
    {
      id: url,
      values: embedding,
      metadata: {
        url,
        qa: qaText,
      },
    },
  ]);
}

async function processUrls(urls) {
  let saved = [];

  if (await fs.pathExists(PAGE_QA_JSON)) {
    saved = await fs.readJson(PAGE_QA_JSON);
  }

  const done = new Set(saved.map((p) => p.url));

  for (const url of urls) {
    if (done.has(url)) {
      console.log("Skipping:", url);
      continue;
    }

    console.log("\nProcessing:", url);

    try {
      const text = await extractPageContent(url);
      if (text.length < 300) continue;

      const qa = await generateQAWithGemini(text);
      const embedding = await generateEmbeddings(qa);

      await upsertToPinecone(url, embedding, qa);

      saved.push({ url, qa });
      await fs.writeJson(PAGE_QA_JSON, saved, { spaces: 2 });

      console.log("Saved & embedded:", url);

      await sleep(60000); 
    } catch (err) {
      console.error("Failed:", url, err.message);
      await sleep(120000);
    }
  }
}
async function runScript() {
  console.log("Initial cooldown (2 minutes)...");
  await sleep(120000);

  const urls = await fetchSitemap();
  await processUrls(urls);

  console.log("\ncompleted.");
}

runScript();

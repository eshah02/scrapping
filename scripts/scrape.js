import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs-extra";
import { parseStringPromise } from "xml2js";

const SITEMAP_URL = "https://resend.com/sitemap.xml";
const OUTPUT_PATH = "data/resend_data.json";
async function getSitemapUrls() {
  try {
    const { data } = await axios.get(SITEMAP_URL);
    const xml = await parseStringPromise(data);
    return xml.urlset.url.map((u) => u.loc[0]);
  } catch (err) {
    console.error("Failed to fetch sitemap:", err.message);
    return [];
  }
}
async function scrapePage(url) {
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    $("script, style, noscript, iframe, head, nav, footer, svg").remove();

    const container = $("main").length ? $("main") : $("body");

    let text = container
      .find("h1, h2, h3, p, li, code, span")
      .map((i, el) => $(el).text().trim())
      .get()
      .join(" ");

    return text.replace(/\s+/g, " ").trim();
  } catch (err) {
    console.error(`Error scraping ${url}:`, err.message);
    return null;
  }
}

async function main() {
  console.log("Starting scraper...");
  const urls = await getSitemapUrls();
  const result = [];

  for (const url of urls) {
    console.log(`Processing: ${url}`);
    const text = await scrapePage(url);
    
    if (text && text.length > 100) { 
      result.push({ url, text });
    }
  }

  await fs.ensureDir("data");
  await fs.writeJson(OUTPUT_PATH, result, { spaces: 2 });

  console.log(`\nSuccess! Scraped ${result.length} pages.`);
  console.log(`File saved to: ${OUTPUT_PATH}`);
}
main();



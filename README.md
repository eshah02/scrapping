This is a (RAG) chatbot built using Next.js, Google Gemini, and Pinecone.
It scrapes documentation content from resend.com, processes it using Google Gemini embeddings, and stores it in Pinecone.

Tech Stack:
Google Gemini API for text embeddings and content understanding.
Axios used for HTTP requests.
Cheerio for HTML parsing and raw text extraction.

Data Source:
Content is scraped from Resend documentation sitemap:https://resend.com/sitemap.xml

Workflow:
Sitemap Scraping:
the sitemap is fetched using Axios.
XML is parsed using xml2js.
all documentation page URLs are extracted.

Page Content Extraction:
Each page is fetched individually.
Cheerio is used to scrape raw readable text.
Extracted data is saved locally in json file resend_data.json this file contain extracted text and URLs.

Q&A Generation using Gemini:
The model text-embedding-004 is used.
For each page content is summarized and 5 Question–Answers are generated.
due to Gemini free-tier rate limits, timers are implemented to safely process all pages.
Generated output is saved in page_qa.json.

Embedding and Pinecone:
embeddings are generated from question answers data.
data is upserted into Pinecone
Pinecone index Dimension: 768

Environment Variables:
used two API keys GOOGLE_API_KEY, PINECONE_API_KEY.

Utilities:
fs-extra,dotenv,xml2js
These utilities help to manage Web scraping,data processing,API key handling





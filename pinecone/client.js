import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("Missing PINECONE_API_KEY in .env");
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const getIndex = (indexName) => {
  if (!indexName) throw new Error("indexName required");
  return pinecone.index(indexName);
};

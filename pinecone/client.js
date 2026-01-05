import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("Missing PINECONE_API_KEY");
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export function getIndex() {
  if (!process.env.PINECONE_INDEX) {
    throw new Error("Missing PINECONE_INDEX");
  }
  return pinecone.index(process.env.PINECONE_INDEX);
}

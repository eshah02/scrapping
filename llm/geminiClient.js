import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);


export const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

export async function embedText(text) {
  const result = await embeddingModel.embedContent({
    content: text,
  });

  return result.embedding.values;
}

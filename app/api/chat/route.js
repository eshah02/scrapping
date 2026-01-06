import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getIndex } from "@/pinecone/client";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

export async function POST(req) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: "Question required" }, { status: 400 });
    }

    const embedRes = await embeddingModel.embedContent(question);
    const vector = embedRes.embedding.values;

    const index = getIndex();
    const search = await index.query({
      vector,
      topK: 10,
      includeMetadata: true,
    });

    const context = search.matches
      .map((m, i) => `Source ${i + 1}:\n${m.metadata.qa}`)
      .join("\n\n");

    
    const prompt = `
You are a Resend documentation assistant.

Rules:
- Answer in plain text only
- Do NOT use markdown, bullets, asterisks, or special symbols
- Keep answers short and clear (max 4-5 lines)
- If the answer is not found in the context, say:
  "I can only answer questions related to the Resend website."

CONTEXT:
${context}

QUESTION:
${question}
`;

    const res = await chatModel.generateContent(prompt);

    return NextResponse.json({
      answer: res.response.text(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

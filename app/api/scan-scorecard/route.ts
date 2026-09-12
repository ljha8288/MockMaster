import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY missing" }, { status: 500 });
    }

    const { imageBase64, examPreset, mockType, platform } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `You are an OCR engine for competitive exam scorecards (SSC, Banking).
Extract section marks, correct count, wrong count, and unattempted count for:
1. reasoning
2. gs
3. maths
4. english

Return strictly raw JSON format without markdown code blocks:
{
  "mockName": "${examPreset} ${mockType}",
  "sections": {
    "reasoning": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0 },
    "gs": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0 },
    "maths": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0 },
    "english": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0 }
  }
}`;

    let rawText = "";
    let lastErr = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const res = await model.generateContent([
          prompt,
          { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } }
        ]);
        rawText = res.response.text();
        if (rawText) break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!rawText && lastErr) throw lastErr;

    const clean = rawText.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(clean));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}

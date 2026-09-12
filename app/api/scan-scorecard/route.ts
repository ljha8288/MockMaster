import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured in Vercel" }, { status: 500 });
    }

    const { imageBase64, examPreset, mockType, platform } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Scorecard image missing" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `You are an automated OCR scorecard parser for exams like SSC, Banking, Railways.
Parse this ${platform} ${examPreset} (${mockType}) scorecard image.
Extract exact numerical data for the 4 core sections:
1. reasoning (Intelligence/Reasoning)
2. gs (General Awareness/GS/GK)
3. maths (Quantitative Aptitude)
4. english (English Comprehension)

Return strictly valid JSON with this format:
{
  "mockName": "${examPreset} Mock Test",
  "sections": {
    "reasoning": { "correct": 0, "wrong": 0, "marks": 0 },
    "gs": { "correct": 0, "wrong": 0, "marks": 0 },
    "maths": { "correct": 0, "wrong": 0, "marks": 0 },
    "english": { "correct": 0, "wrong": 0, "marks": 0 }
  }
}
Return raw JSON only, no markdown backticks.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const rawText = result.response.text();
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to scan scorecard" }, { status: 500 });
  }
}

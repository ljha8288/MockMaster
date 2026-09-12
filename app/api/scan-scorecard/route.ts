import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY Vercel settings mein missing hai" }, { status: 500 });
    }

    const { imageBase64, examPreset, mockType, platform } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Scorecard image nahi mili" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Exact standard model string without '-latest'
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `You are an automated OCR scorecard parser for SSC CGL, CHSL, Banking exams.
Extract the section-wise performance from this scorecard image for:
1. reasoning (General Intelligence and Reasoning)
2. gs (General Awareness / GK)
3. maths (Quantitative Aptitude)
4. english (English Comprehension)

Return strictly valid JSON only:
{
  "mockName": "${examPreset} Mock Test",
  "sections": {
    "reasoning": { "correct": 0, "wrong": 0, "marks": 0, "accuracy": "0%", "time": "00:00" },
    "gs": { "correct": 0, "wrong": 0, "marks": 0, "accuracy": "0%", "time": "00:00" },
    "maths": { "correct": 0, "wrong": 0, "marks": 0, "accuracy": "0%", "time": "00:00" },
    "english": { "correct": 0, "wrong": 0, "marks": 0, "accuracy": "0%", "time": "00:00" }
  }
}
No markdown fences, output raw JSON only.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const text = result.response.text().trim();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to parse scorecard" }, { status: 500 });
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `You are an expert OCR and exam scorecard parser for competitive exams. Analyze this scorecard image and return strictly valid JSON matching this exact structure:
    {
      "test_name": "Test Name or Exam",
      "platform": "Testbook/Oliveboard/Other",
      "total_score": 0,
      "max_score": 200,
      "accuracy": 0,
      "percentile": 0,
      "rank": 0,
      "sections": [
        {
          "name": "Section Name",
          "score": 0,
          "max_score": 50,
          "correct": 0,
          "incorrect": 0,
          "unattempted": 0,
          "accuracy": 0
        }
      ]
    }
    Output ONLY the JSON object. Do not wrap in backticks or markdown.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const text = result.response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to scan" }, { status: 500 });
  }
}

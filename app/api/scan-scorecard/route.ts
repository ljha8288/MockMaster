import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert OCR parser for Govt Exam Mock Test scorecards (Testbook, Oliveboard, RBE).
      Extract the following details from this image accurately in pure JSON format:
      {
        "mockTitle": "extracted title or 'Mock Test'",
        "platform": "Oliveboard",
        "score": 0.0,
        "totalMarks": 200,
        "accuracy": 0.0,
        "attempted": 0,
        "correct": 0,
        "wrong": 0,
        "timeSpent": "e.g. 54m 20s"
      }
      Return ONLY raw JSON, no markdown blocks, no explanation.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type || "image/png",
        },
      },
    ]);

    const cleanJson = result.response.text().replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

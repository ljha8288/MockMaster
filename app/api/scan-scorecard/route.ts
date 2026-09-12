import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY missing in Vercel settings" }, { status: 500 });
    }

    const { imageBase64, examPreset, mockType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Scorecard screenshot missing" }, { status: 400 });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const promptText = `Extract marks, correct count, wrong count, unattempted count, and accuracy for reasoning, gs, maths, and english from this government exam scorecard image (Testbook/Oliveboard/Adda247).
Return STRICTLY raw valid JSON without markdown:
{
  "mockName": "${examPreset || "SSC Mock"} ${mockType || "Full Mock"}",
  "totalScore": 0,
  "accuracy": 0,
  "percentile": 0,
  "sections": {
    "reasoning": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0, "accuracy": 0 },
    "gs": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0, "accuracy": 0 },
    "maths": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0, "accuracy": 0 },
    "english": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0, "accuracy": 0 }
  }
}`;

    const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const apiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: promptText },
                    { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
                  ],
                },
              ],
            }),
          }
        );

        const resJson = await apiRes.json();
        if (apiRes.ok && resJson.candidates?.[0]?.content?.parts?.[0]?.text) {
          const rawText = resJson.candidates[0].content.parts[0].text;
          const cleanOutput = rawText.replace(/```json|```/g, "").trim();
          return NextResponse.json(JSON.parse(cleanOutput));
        }
        lastError = resJson.error?.message || `HTTP ${apiRes.status}`;
      } catch (err: any) {
        lastError = err.message;
      }
    }

    throw new Error(lastError || "Failed to process OCR");
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to parse scorecard" }, { status: 500 });
  }
}

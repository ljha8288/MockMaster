import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY missing in Vercel settings" }, { status: 500 });
    }

    const { imageBase64, examPreset, mockType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Scorecard image missing" }, { status: 400 });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const promptText = `Extract marks, correct, wrong, and unattempted counts for reasoning, gs, maths, english from this scorecard image.
Return ONLY valid JSON matching this structure:
{
  "mockName": "${examPreset || "Mock Test"} ${mockType || "Full Mock"}",
  "sections": {
    "reasoning": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0 },
    "gs": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0 },
    "maths": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0 },
    "english": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0 }
  }
}`;

    // Directly calling the required gemini-3.6-flash endpoint
    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const resJson = await apiRes.json();
    if (!apiRes.ok || resJson.error) {
      throw new Error(resJson.error?.message || `API Error: ${apiRes.status}`);
    }

    const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleanOutput = rawText.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(cleanOutput));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to scan" }, { status: 500 });
  }
}

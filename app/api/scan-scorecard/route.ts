import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY Vercel Environment Variables mein missing hai." }, { status: 500 });
    }

    const { imageBase64, examPreset, mockType, platform } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Scorecard screenshot nahi mila." }, { status: 400 });
    }

    // 1. Fetch available models for this API key to permanently avoid 404
    let chosenModel = "gemini-2.5-flash";
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listRes.json();
      if (listData.models && Array.isArray(listData.models)) {
        const supported = listData.models.filter((m: any) => 
          m.supportedGenerationMethods?.includes("generateContent") &&
          (m.name.includes("flash") || m.name.includes("pro"))
        );
        // Priority order for newest active models
        const preferred = supported.find((m: any) => m.name.includes("3.5-flash") || m.name.includes("3.1-flash") || m.name.includes("2.5-flash") || m.name.includes("2.0-flash"));
        if (preferred) {
          chosenModel = preferred.name.replace("models/", "");
        } else if (supported.length > 0) {
          chosenModel = supported[0].name.replace("models/", "");
        }
      }
    } catch (e) {
      console.error("Auto model detect fallback:", e);
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const promptText = `You are an automated OCR scorecard parser for exams like SSC CGL, CHSL, CPO, Banking.
Extract section marks, correct count, wrong count, and unattempted count for:
1. reasoning (General Intelligence & Reasoning)
2. gs (General Awareness / GK)
3. maths (Quantitative Aptitude)
4. english (English Language)

Return strictly valid JSON only:
{
  "mockName": "${examPreset} ${mockType}",
  "sections": {
    "reasoning": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0 },
    "gs": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0 },
    "maths": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0 },
    "english": { "correct": 0, "wrong": 0, "unattempted": 0, "marks": 0 }
  }
}
No backticks, return raw JSON string.`;

    // 2. Direct REST Call to the active model
    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey}`, {
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
                  data: cleanBase64
                }
              }
            ]
          }
        ]
      })
    });

    const resJson = await apiRes.json();
    if (!apiRes.ok || resJson.error) {
      throw new Error(resJson.error?.message || `HTTP ${apiRes.status} Error`);
    }

    const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const cleanOutput = rawText.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(cleanOutput));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to scan" }, { status: 500 });
  }
}

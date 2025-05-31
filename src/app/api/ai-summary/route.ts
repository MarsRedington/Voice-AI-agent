import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    if (!json || typeof json !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { callId, structuredData } = json;

    if (
      !callId ||
      typeof structuredData !== "object" ||
      Object.keys(structuredData).length === 0
    ) {
      return NextResponse.json(
        { error: "Missing or invalid structured data" },
        { status: 400 }
      );
    }

    const language = structuredData.language?.toLowerCase();
    const promptEN = `
        You are a medical assistant. Given this structured consultation data:
        ${JSON.stringify(structuredData, null, 2)}
        Generate a concise and professional consultation summary in English.
    `.trim();

    const completionEN = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: promptEN }],
    });

    const summaryEN = completionEN.choices[0].message.content ?? "";

    let translatedSummary: string | null = null;

    if (language && language !== "english") {
      const translationPrompt = `
        Translate the following medical consultation summary to ${language}:
        ${summaryEN}
      `.trim();

      try {
        const translation = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: translationPrompt }],
        });

        translatedSummary = translation.choices[0].message.content ?? null;
      } catch (translationError) {
        console.warn("Translation failed:", translationError);
      }
    }

    await db.collection("callbacks").doc(callId).update({
      aiSummary: summaryEN,
      aiSummaryTranslated: translatedSummary,
      aiSummaryAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AI_SUMMARY_ERROR]", error);
    return NextResponse.json({ error: "AI summary failed" }, { status: 500 });
  }
}

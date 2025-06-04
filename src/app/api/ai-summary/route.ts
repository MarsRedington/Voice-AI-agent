import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import OpenAI from "openai";
import * as admin from "firebase-admin";
import { sendEmail } from "@/lib/mailer";

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
    const language = (structuredData.language as string | undefined)?.toLowerCase();
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
      status: "summary_generated",
    });

    const callbackDoc = await db.collection("callbacks").doc(callId).get();
    const callbackData = callbackDoc.data();
    const email = callbackData?.email as string | undefined;
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 500 });
    }

    const actionCodeSettings = {
      url: `http://localhost:3000/secure/${callId}`,
      handleCodeInApp: true,
    };
    const firebaseAuth = admin.auth();
    const link = await firebaseAuth.generateSignInWithEmailLink(email, actionCodeSettings);

    const html = `
      <h2>Your medical summary</h2>
      <p>You can find full description below</p>
      <p><strong>Summary (EN):</strong> ${summaryEN}</p>
      ${translatedSummary ? `<p><strong>Summary (${language}):</strong> ${translatedSummary}</p>` : ""}
      <p>To see full details, follow the link:</p>
      <p><a href="${link}">Open consultation details</a></p>
    `;

    await sendEmail(email, "Your medical summary is ready", html);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AI_SUMMARY_ERROR]", error);
    return NextResponse.json({ error: "AI summary failed" }, { status: 500 });
  }
}

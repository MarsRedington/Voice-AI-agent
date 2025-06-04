import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

type VapiWebhookBody = {
  message?: {
    type?: string;
    analysis?: {
      structuredData?: Record<string, string>;
    };
    call?: {
      id: string;
    };
  };
};

export async function POST(req: NextRequest) {
  const text = await req.text();
  let body: VapiWebhookBody;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (body.message?.type !== "end-of-call-report") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const structuredData = body.message.analysis?.structuredData;
  const callId = body.message.call?.id;

  if (!callId || !structuredData) {
    console.error("Missing callId or structuredData in webhook");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  await db.collection("callbacks").doc(callId).update({
    structuredData,
    status: "call_completed",
    updatedAt: new Date().toISOString(),
  });

  try {
    await fetch("http://localhost:3000/api/ai-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId, structuredData }),
    });
  } catch (e) {
    console.error("Error calling ai-summary:", e);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

const VAPI_API_KEY = process.env.VAPI_API_KEY!;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID!;
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;

type CallUserRequestBody = {
  email: string;
  phone: string;
};

export async function POST(req: NextRequest) {
  let body: CallUserRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = typeof body.phone === "string" ? body.phone : null;
  const email = typeof body.email === "string" ? body.email : null;
  if (!phone || !email) {
    return NextResponse.json(
      { error: "Missing phone or email" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId: VAPI_ASSISTANT_ID,
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: { number: phone },
        assistantOverrides: {
          variableValues: { email },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[VAPI_CALL_ERROR] ${JSON.stringify(data)}`);
      return NextResponse.json(
        { error: data.message || "Vapi call failed" },
        { status: response.status }
      );
    }

    const callId = data.id as string;

    await db.collection("callbacks").doc(callId).set({
      email,
      phone,
      status: "initiated",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, callId }, { status: 200 });
  } catch (err: unknown) {
    console.error(`[VAPI_FETCH_ERROR] ${String(err)}`);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

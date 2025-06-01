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

    const structuredData = await response.json();

    if (!response.ok) {
      console.error(`[VAPI_CALL_ERROR] ${JSON.stringify(structuredData)}`);
      return NextResponse.json(
        { error: structuredData.message || "Vapi call failed" },
        { status: response.status }
      );
    }

    //const fakeCallId = crypto.randomUUID()
    const callId = structuredData.id as string;

await new Promise(resolve => setTimeout(resolve, 1000))

  // const structuredData = {
  //   consultation_type: "General health",
  //   category: "Dermatology",
  //   country: "Canada",
  //   language: "French",
  //   urgency: "Not urgent",
  //   address: "Calgary",
  //   summary: "Client is seeking a general health consultation related to dermatology. They did not provide specific details.",
  // }

    await db.collection("callbacks").doc(callId).set({
      email,
      phone,
      status: "initiated",
      createdAt: new Date().toISOString(),
    });
        await db.collection("callbacks").doc(callId).update({
      structuredData,
      updatedAt: new Date().toISOString(),
    })


    await fetch("http://localhost:3000/api/vapi-webhook", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: {
      type: "end-of-call-report",
      call: { id: callId },
      analysis: {
        structuredData: structuredData,
      },
    },
  }),
});

    return NextResponse.json({ success: true, callId }, { status: 200 });
  } catch (err: unknown) {
    console.error(`[VAPI_FETCH_ERROR] ${String(err)}`);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
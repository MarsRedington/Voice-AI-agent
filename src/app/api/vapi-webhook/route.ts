import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/mailer";
import { db } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

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

  const structuredData = body.message?.analysis?.structuredData;
  const callId = body.message?.call?.id;

  if (!callId || !structuredData) {
    console.error("Missing callId or structuredData in webhook");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const callbackDoc = await db.collection("callbacks").doc(callId).get();
  const { email } = callbackDoc.data() || {};

  if (!email) {
    console.error("Email not found in Firestore");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  await db.collection("callbacks").doc(callId).update({
    structuredData: structuredData,
    updatedAt: new Date().toISOString(),
  });

  const actionCodeSettings = {
    url: `http://localhost:3000/secure/${callId}`,
    handleCodeInApp: true,
  };

  const firebase = admin.auth();
  const link = await firebase.generateSignInWithEmailLink(
    email,
    actionCodeSettings
  );

  const html = `
    <h2>Thank you for your call</h2>
    <p>You can view all the data at the following link:</p>
    <p><a href="${link}">Open my details</a></p>
  `;

  await sendEmail(email, "Your consultation results", html);

  return NextResponse.json({ received: true }, { status: 200 });
}

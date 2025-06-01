/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Mock NextResponse.json to return a standard Response, so res.json() isn't called in route.
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, opts: { status: number }) => {
      return new Response(JSON.stringify(body), { status: opts.status });
    },
  },
}));

// Mocks for external dependencies
jest.mock("@/lib/mailer", () => ({
  sendEmail: jest.fn(),
}));
jest.mock("@/lib/firebaseAdmin", () => {
  return {
    db: {
      collection: jest.fn(),
    },
  };
});
jest.mock("firebase-admin", () => ({
  auth: jest.fn(() => ({
    generateSignInWithEmailLink: jest.fn(),
  })),
}));

import { sendEmail } from "@/lib/mailer";
import { db } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";
import { POST } from "../route";

describe("POST /api/vapi-webhook", () => {
  // Utility to create a NextRequest-like object from JSON string
  const makeRequest = (body: unknown) => {
    const jsonString = typeof body === "string" ? body : JSON.stringify(body);
    return new Request("http://localhost/api/vapi-webhook", {
      method: "POST",
      body: jsonString,
      headers: { "Content-Type": "application/json" },
    }) as unknown as Parameters<typeof POST>[0];
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 for invalid JSON", async () => {
    const invalidBody = "{ not valid json ";
    const req = makeRequest(invalidBody);
    const res = await POST(req);
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ received: true });
  });

  it("returns 200 when message.type !== 'end-of-call-report'", async () => {
    const req = makeRequest({
      message: { type: "some-other-type" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ received: true });
  });

  it("returns 200 when missing callId or structuredData", async () => {
    // Missing structuredData
    const req1 = makeRequest({
      message: { type: "end-of-call-report", call: { id: "abc" } },
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    expect(JSON.parse(await res1.text())).toEqual({ received: true });

    // Missing callId
    const req2 = makeRequest({
      message: { type: "end-of-call-report", analysis: {} },
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(200);
    expect(JSON.parse(await res2.text())).toEqual({ received: true });
  });

  it("returns 200 when email not found in Firestore", async () => {
    // Mock Firestore to return no email
    const mockDoc = { data: () => ({}) };
    const mockDocRef = {
      get: jest.fn().mockResolvedValue(mockDoc),
      update: jest.fn(),
    };
    (db.collection as jest.Mock).mockReturnValue({
      doc: jest.fn(() => mockDocRef),
    });

    const req = makeRequest({
      message: {
        type: "end-of-call-report",
        call: { id: "call123" },
        analysis: { structuredData: { foo: "bar" } },
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(db.collection).toHaveBeenCalledWith("callbacks");
    expect(mockDocRef.get).toHaveBeenCalled();
    expect(JSON.parse(await res.text())).toEqual({ received: true });
  });

  it("processes valid webhook and sends email + triggers AI summary", async () => {
    // Set up mocks:
    // - Firestore: get returns { email }
    // - update resolves
    // - admin.auth().generateSignInWithEmailLink returns a mock link
    // - global.fetch is mocked to capture AI-summary call
    const mockEmail = "test@example.com";
    const mockCallId = "callABC";
    const mockStructuredData = { key1: "value1" };

    // Firestore mocks
    const mockDocSnapshot = {
      data: () => ({ email: mockEmail }),
    };
    const mockDocRef = {
      get: jest.fn().mockResolvedValue(mockDocSnapshot),
      update: jest.fn().mockResolvedValue(undefined),
    };
    (db.collection as jest.Mock).mockReturnValue({
      doc: jest.fn(() => mockDocRef),
    });

    // Mock generateSignInWithEmailLink
    const fakeLink = "https://magic.link/abc";
    const authMock = (admin.auth as jest.Mock).mockReturnValue({
      generateSignInWithEmailLink: jest.fn().mockResolvedValue(fakeLink),
    });

    // Mock global.fetch
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
    });
    global.fetch = fetchMock as any;

    const req = makeRequest({
      message: {
        type: "end-of-call-report",
        call: { id: mockCallId },
        analysis: { structuredData: mockStructuredData },
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Firestore interactions
    expect(db.collection).toHaveBeenCalledWith("callbacks");
    expect((db.collection("callbacks") as any).doc).toHaveBeenCalledWith(mockCallId);
    expect(mockDocRef.get).toHaveBeenCalled();
    expect(mockDocRef.update).toHaveBeenCalledWith({
      structuredData: mockStructuredData,
      updatedAt: expect.any(String),
    });

    // Email link generation
    expect(admin.auth).toHaveBeenCalled();
    expect(authMock().generateSignInWithEmailLink).toHaveBeenCalledWith(
      mockEmail,
      {
        url: `http://localhost:3000/secure/${mockCallId}`,
        handleCodeInApp: true,
      }
    );

    // sendEmail should be called with correct args
    expect(sendEmail).toHaveBeenCalledWith(
      mockEmail,
      "Your consultation results",
      expect.stringContaining(`<a href="${fakeLink}">`)
    );

    // AI-summary endpoint call
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/ai-summary",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: mockCallId, structuredData: mockStructuredData }),
      }
    );

    expect(JSON.parse(await res.text())).toEqual({ received: true });
  });
});

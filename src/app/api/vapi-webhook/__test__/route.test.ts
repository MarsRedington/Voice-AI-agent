/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Mock NextResponse.json to return a standard Response
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, opts: { status: number }) => {
      return new Response(JSON.stringify(body), { status: opts.status });
    },
  },
}));

// Mock Firestore dependency
jest.mock("@/lib/firebaseAdmin", () => {
  return {
    db: {
      collection: jest.fn(),
    },
  };
});

import { db } from "@/lib/firebaseAdmin";
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

  it("processes valid webhook and triggers AI summary", async () => {
    const mockCallId = "callABC";
    const mockStructuredData = { key1: "value1" };

    // Firestore mocks
    const mockDocRef = {
      update: jest.fn().mockResolvedValue(undefined),
    };
    (db.collection as jest.Mock).mockReturnValue({
      doc: jest.fn(() => mockDocRef),
    });

    // Mock global.fetch for ai-summary call
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
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

    // Verify Firestore update was called with correct fields
    expect(db.collection).toHaveBeenCalledWith("callbacks");
    expect((db.collection("callbacks") as any).doc).toHaveBeenCalledWith(mockCallId);
    expect(mockDocRef.update).toHaveBeenCalledWith({
      structuredData: mockStructuredData,
      status: "call_completed",
      updatedAt: expect.any(String),
    });

    // Verify AI-summary endpoint was called with correct payload
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

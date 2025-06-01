/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import SecurePageClient from "../securePageClient";

// 1. Mock "@/lib/firebase" so that `db` and `auth` exist as placeholders.
jest.mock("@/lib/firebase", () => ({
  db: {}, // unused directly by our mocks
  auth: {}, // passed into onAuthStateChanged
}));

// 2. Mock "firebase/auth" exports.
jest.mock("firebase/auth", () => ({
  isSignInWithEmailLink: jest.fn(),
  signInWithEmailLink: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// 3. Mock "firebase/firestore" with jest.fn() exports.
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

import {
  isSignInWithEmailLink,
  onAuthStateChanged,
} from "firebase/auth";
import * as firestore from "firebase/firestore";
import { getDoc, doc } from "firebase/firestore";

type StructuredData = {
  consultation_type: string;
  category: string;
  country: string;
  language: string;
  urgency: string;
  address: string;
  summary: string;
};

type CallbackData = {
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  structuredData?: StructuredData;
  aiSummary?: string;
  aiSummaryAt?: string;
  aiSummaryTranslated?: string;
};

describe("SecurePageClient (client component)", () => {
  const mockId = "test-id";

  beforeEach(() => {
    // Pretend no sign-in link by default
    (isSignInWithEmailLink as jest.Mock).mockReturnValue(false);

    // onAuthStateChanged immediately calls back with a user
    (onAuthStateChanged as jest.Mock).mockImplementation(
      (_authObj: any, callback: (user: any) => void) => {
        callback({ uid: "fake-user" });
        return jest.fn(); // unsubscribe
      }
    );

    // Make doc(...) return an object with withConverter method
    (doc as jest.Mock).mockReturnValue({
      withConverter: jest.fn().mockReturnThis(),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("shows Loading... initially, then renders Structured Data when aiSummary is absent", async () => {
    const fakeStructuredData: StructuredData = {
      consultation_type: "Type A",
      category: "Category X",
      country: "Canada",
      language: "English",
      urgency: "High",
      address: "123 Main St",
      summary: "Short summary",
    };
    const callbackDoc: CallbackData = {
      email: "user@example.com",
      phone: "+1234567890",
      status: "pending",
      createdAt: "2025-06-01T12:00:00Z",
      structuredData: fakeStructuredData,
      // aiSummary is undefined
    };

    // getDoc resolves to snapshot with exists() true and data() returning callbackDoc
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => callbackDoc,
    });

    render(<SecurePageClient id={mockId} />);

    // Initially: Loading...
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    // Wait for "Structured Data" heading
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Structured Data/i })
      ).toBeInTheDocument();
    });

    // Verify each entry from structuredData is displayed
    for (const [key, value] of Object.entries(fakeStructuredData)) {
      expect(screen.getByText(new RegExp(`${key}:`, "i"))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(value, "i"))).toBeInTheDocument();
    }
  });

  it("renders AI Summary (English) and translated summary when aiSummary is present", async () => {
    const fakeStructuredData: StructuredData = {
      consultation_type: "Type B",
      category: "Category Y",
      country: "USA",
      language: "Spanish",
      urgency: "Low",
      address: "456 Elm St",
      summary: "Another summary",
    };
    const callbackDoc: CallbackData = {
      email: "other@example.com",
      phone: "+1987654321",
      status: "completed",
      createdAt: "2025-05-30T09:00:00Z",
      structuredData: fakeStructuredData,
      aiSummary: "This is the AI-generated summary in English.",
      aiSummaryAt: "2025-06-02T08:00:00Z",
      aiSummaryTranslated: "Este es el resumen generado por IA en Español.",
    };

    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => callbackDoc,
    });

    render(<SecurePageClient id={mockId} />);

    // Initially: Loading...
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    // Wait for AI Summary (English) heading
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /AI Summary \(English\)/i })
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/This is the AI-generated summary in English\./i)
    ).toBeInTheDocument();

    // Expect translated summary heading and text
    expect(
      screen.getByRole("heading", { name: /AI Summary \(Spanish\)/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Este es el resumen generado por IA en Español\./i)
    ).toBeInTheDocument();

    // "Structured Data" heading should NOT appear when aiSummary is present
    expect(
      screen.queryByRole("heading", { name: /Structured Data/i })
    ).not.toBeInTheDocument();
  });

  it("does nothing if snapshot does not exist (remains on Loading...)", async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => false,
    });

    render(<SecurePageClient id={mockId} />);

    // Initially: Loading...
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    // Wait a short moment; still "Loading..."
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });
});

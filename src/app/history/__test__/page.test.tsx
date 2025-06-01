/* eslint-disable @typescript-eslint/no-unused-vars */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import HistoryPage from "../page";

// 1. Mock "@/lib/firebase" so that `db` is available (unused directly by getDocs).
jest.mock("@/lib/firebase", () => ({
  db: {}, // placeholder
}));

// 2. Mock "firebase/firestore" exports: collection and getDocs.
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

import { getDocs } from "firebase/firestore";

type Callback = {
  id: string;
  email: string;
  phone: string;
  createdAt: string;
  aiSummary?: string;
  aiSummaryTranslated?: string;
  structuredData?: Record<string, string>;
};

describe("HistoryPage", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("shows loading initially and then 'No call history found.' if no callbacks", async () => {
    // Make getDocs return an empty snapshot
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [],
    });

    render(<HistoryPage />);

    // Initially should show "Loading..."
    expect(screen.getByText(/Loading\.\.\./i)).toBeInTheDocument();

    // Wait for the loading state to finish and show "No call history found."
    await waitFor(() => {
      expect(
        screen.getByText(/No call history found\./i)
      ).toBeInTheDocument();
    });
  });

  it("renders a list of callbacks and toggles details when 'More details' is clicked", async () => {
    const now = new Date();
    const isoNow = now.toISOString();
    // Sample callbacks: one with aiSummary, one with structuredData, one with neither
    const sampleDocs = [
      {
        id: "1",
        data: () => ({
          email: "user1@example.com",
          phone: "+11111111111",
          createdAt: isoNow,
          aiSummary: "Summary EN 1",
          aiSummaryTranslated: "Resumen 1",
        }),
      },
      {
        id: "2",
        data: () => ({
          email: "user2@example.com",
          phone: "+22222222222",
          createdAt: isoNow,
          structuredData: { fieldA: "Value A", fieldB: "Value B" },
        }),
      },
      {
        id: "3",
        data: () => ({
          email: "user3@example.com",
          phone: "+33333333333",
          createdAt: isoNow,
          // Neither aiSummary nor structuredData
        }),
      },
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      docs: sampleDocs,
    });

    render(<HistoryPage />);

    // Wait for the callbacks to appear
    await waitFor(() => {
      // The heading "Call History" should appear
      expect(
        screen.getByRole("heading", { name: /Call History/i })
      ).toBeInTheDocument();
    });

    // Each callback's email and phone should be visible
    sampleDocs.forEach((doc) => {
      const { email, phone } = doc.data();
      expect(screen.getByText(email)).toBeInTheDocument();
      expect(screen.getByText(phone)).toBeInTheDocument();
    });

    // For each callback, there should be a "More details" button
    const buttons = screen.getAllByRole("button", { name: /More details/i });
    expect(buttons).toHaveLength(3);

    // Click the first callback's "More details" to expand
    fireEvent.click(buttons[0]);

    // Now first callback details should show AI Summary (EN) and translated text
    await waitFor(() => {
      expect(
        screen.getByText(/AI Summary \(EN\):/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Summary EN 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Resumen 1/i)).toBeInTheDocument();
    });

    // Click again to collapse
    fireEvent.click(screen.getByRole("button", { name: /Hide/i }));
    await waitFor(() => {
      expect(
        screen.queryByText(/Summary EN 1/i)
      ).not.toBeInTheDocument();
    });

    // Expand second callback (structuredData)
    const secondButton = screen.getAllByRole("button", { name: /More details/i })[1];
    fireEvent.click(secondButton);

    await waitFor(() => {
      expect(screen.getByText(/fieldA:/i)).toBeInTheDocument();
      expect(screen.getByText(/Value A/i)).toBeInTheDocument();
      expect(screen.getByText(/fieldB:/i)).toBeInTheDocument();
      expect(screen.getByText(/Value B/i)).toBeInTheDocument();
    });

    // Collapse second callback
    fireEvent.click(screen.getByRole("button", { name: /Hide/i }));
    await waitFor(() => {
      expect(screen.queryByText(/fieldA:/i)).not.toBeInTheDocument();
    });

    // Expand third callback (neither aiSummary nor structuredData)
    const thirdButton = screen.getAllByRole("button", { name: /More details/i })[2];
    fireEvent.click(thirdButton);

    await waitFor(() => {
      expect(
        screen.getByText(/No additional data available\./i)
      ).toBeInTheDocument();
    });
  });

  it("formats the createdAt date correctly", async () => {
    // Create a known date string for testing
    const testDate = new Date("2025-01-02T03:04:05Z").toISOString();
    const sampleDoc = {
      id: "x",
      data: () => ({
        email: "date@example.com",
        phone: "+44444444444",
        createdAt: testDate,
      }),
    };

    (getDocs as jest.Mock).mockResolvedValue({
      docs: [sampleDoc],
    });

    render(<HistoryPage />);

    // Wait for the date to render
    await waitFor(() => {
      // Look for the email to ensure the item rendered
      expect(screen.getByText(/date@example.com/i)).toBeInTheDocument();
    });

    // The date should be formatted by toLocaleString; check for the year "2025"
    const dateElement = screen.getByText(/2025/);
    expect(dateElement).toBeInTheDocument();
  });
});

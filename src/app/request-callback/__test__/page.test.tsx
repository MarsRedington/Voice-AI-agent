/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RequestCallbackPage from "../page";

describe("RequestCallbackPage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    render(<RequestCallbackPage />);

    (global as any).fetch = jest.fn(async (input: RequestInfo, init?: RequestInit) => {
      if (typeof input === "string" && input.endsWith("/api/call-user")) {
        return {
          ok: true,
          json: async () => ({ success: true, callId: "mock-id" }),
        } as Response;
      }
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("renders the form and submits with valid data", async () => {
    // Grab both inputs (they render with role="textbox")
    const [emailInput, phoneInput] = screen.getAllByRole("textbox");
    const submitButton = screen.getByRole("button", { name: /send/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(phoneInput, "+12345678901");
    await userEvent.click(submitButton);

    // Wait until fetch has been called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Extract the arguments passed to fetch
    const [calledUrl, calledOptions] = (global.fetch as jest.Mock).mock.calls[0];

    expect(calledUrl).toBe("/api/call-user");
    expect(calledOptions).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    // Validate that the request body, when parsed, contains the correct fields
    const parsedBody = JSON.parse((calledOptions as RequestInit).body as string);
    expect(parsedBody).toEqual({
      email: "test@example.com",
      phone: "+12345678901",
    });
  });

  it("shows validation errors", async () => {
    const submitButton = screen.getByRole("button", { name: /send/i });
    await userEvent.click(submitButton);

    expect(await screen.findByText(/incorrect email/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/incorrect phone format/i)
    ).toBeInTheDocument();
  });
});

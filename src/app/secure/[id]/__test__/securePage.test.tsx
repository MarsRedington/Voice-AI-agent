// src/app/secure/[id]/securePage.test.tsx

// import { render} from "@testing-library/react";
// import SecurePage from "../page";
// import React from "react";

// // Mock the client component so we can verify it receives the correct `id` prop
// jest.mock("../securePageClient", () => ({
//   __esModule: true,
//   default: ({ id }: { id: string }) => <div>SecurePageClient id: {id}</div>,
// }));

// describe("SecurePage (server component)", () => {
//   it("renders SecurePageClient with the correct id prop", () => {
//     // Since SecurePage is an async server component, we can render it directly
//     // with React Testing Library. It should render the mocked SecurePageClient.
//     const params = { id: "abc123" };
//     const { container } = render(<SecurePage params={params} />);

//     // The mocked SecurePageClient should output its id marker
//     expect(container).toHaveTextContent("SecurePageClient id: abc123");
//   });
// });

// src/app/secure/[id]/__test__/securePage.test.tsx

import React from "react";
import { render } from "@testing-library/react";

// Mock the client component so we can verify it receives the correct `id` prop
jest.mock("../securePageClient", () => ({
  __esModule: true,
  default: ({ id }: { id: string }) => <div>SecurePageClient id: {id}</div>,
}));

// Import the server component (it's an async function)
import SecurePage from "../page";

describe("SecurePage (server component)", () => {
  it("renders SecurePageClient with the correct id prop", async () => {
    // Call the async server component to get its JSX
    const element = await SecurePage({ params: { id: "abc123" } });
    // Render that JSX
    const { container } = render(element as React.ReactElement);

    // Confirm the mocked SecurePageClient shows the right id
    expect(container).toHaveTextContent("SecurePageClient id: abc123");
  });
});

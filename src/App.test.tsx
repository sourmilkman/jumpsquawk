import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({
    ok: false,
    json: async () => ({ ok: false, realtimeReady: false })
  }))
);

describe("App", () => {
  it("renders the mobile-first practice surface", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Practice Spanish" })).toBeInTheDocument();
    expect(screen.getByText("Greetings and Introductions")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /practice/i }).length).toBeGreaterThan(0);
  });
});

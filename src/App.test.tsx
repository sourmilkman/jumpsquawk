import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("sends typed practice without requiring the mic first", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = await screen.findByLabelText("Type a practice reply");
    await user.type(input, "Me llamo Tom");
    await user.click(screen.getByRole("button", { name: "Send typed reply" }));

    expect(await screen.findByText("Me llamo Tom")).toBeInTheDocument();
    expect(screen.getAllByText(/Typed practice started/i).length).toBeGreaterThan(0);
  });
});

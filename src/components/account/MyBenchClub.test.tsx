import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MyBenchClub } from "./MyBenchClub";

vi.mock("@/context/AuthContext", () => {
  const user = { id: 1, name: "Test User", email: "test@example.com", role: "customer" };
  return {
    useAuth: () => ({ user, token: "test-token" }),
  };
});

const mockApiResponses = (members: unknown[], applications: unknown[] = []) => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, members }),
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: applications }),
    }));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MyBenchClub Deadlift products", () => {
  it("hides products until a Deadlift membership is approved", async () => {
    mockApiResponses([]);
    render(<MyBenchClub />);

    const heading = await screen.findByRole("heading", { name: "Deadlift Tier Products" });
    const section = heading.closest("section");
    if (!section) throw new Error("Deadlift products section was not rendered.");

    expect(within(section).queryByText("0 / 5 unlocked")).not.toBeInTheDocument();
    expect(within(section).queryByRole("button", { name: "Locked" })).not.toBeInTheDocument();
    expect(within(section).queryByRole("link", { name: "Shop Now" })).not.toBeInTheDocument();
    expect(within(section).getByText(/for verified Deadlift Club members/)).toBeInTheDocument();
  });

  it("unlocks only products at or below the verified Deadlift tier", async () => {
    mockApiResponses([
      { id: 1, name: "Test User", email: "test@example.com", lift_type: "Bench Press", weight_tier: 405, member_number: 1 },
      { id: 2, name: "Test User", email: "test@example.com", lift_type: "Deadlift", weight_tier: 315, member_number: 2 },
    ]);
    render(<MyBenchClub />);

    const heading = await screen.findByRole("heading", { name: "Deadlift Tier Products" });
    const section = heading.closest("section") as HTMLElement;

    expect(within(section).getByText("2 / 6 unlocked")).toBeInTheDocument();
    expect(within(section).getAllByRole("button", { name: "Locked" })).toHaveLength(4);
    expect(within(section).getAllByRole("link", { name: "Shop Now" })).toHaveLength(2);
    expect(within(section).queryByText(/for verified Deadlift Club members/)).not.toBeInTheDocument();
  });

  it("uses the approved application lift type when an older member response omits lift_type", async () => {
    mockApiResponses(
      [{ id: 1, name: "Test User", email: "test@example.com", weight_tier: 315, member_number: 1 }],
      [{
        id: 7,
        name: "Test User",
        email: "test@example.com",
        lift_type: "Deadlift",
        weight_tier: 315,
        video_url: "",
        notes: null,
        status: "approved",
        created_at: "2026-10-16T00:00:00.000Z",
      }],
    );
    render(<MyBenchClub />);

    const deadliftHeading = await screen.findByRole("heading", { name: "Deadlift Tier Products" });
    const deadliftSection = deadliftHeading.closest("section");
    if (!deadliftSection) throw new Error("Deadlift products section was not rendered.");

    expect(within(deadliftSection).getByText("2 / 6 unlocked")).toBeInTheDocument();
    expect(within(deadliftSection).getAllByRole("link", { name: "Shop Now" })).toHaveLength(2);

    const benchHeading = screen.getByRole("heading", { name: "Tier Products" });
    const benchSection = benchHeading.closest("section");
    if (!benchSection) throw new Error("Bench products section was not rendered.");

    expect(within(benchSection).queryByRole("link", { name: "Shop Now" })).not.toBeInTheDocument();
    expect(within(benchSection).getByText("Become a member to unlock tier products.")).toBeInTheDocument();
  });

  it("marks the most recently approved Deadlift application current and unlocks through the highest approved tier", async () => {
    mockApiResponses(
      [{ id: 1, name: "Test User", email: "test@example.com", lift_type: "Deadlift", weight_tier: 405, member_number: 1 }],
      [
        {
          id: 7,
          name: "Test User",
          email: "test@example.com",
          lift_type: "Deadlift",
          weight_tier: 405,
          video_url: "",
          notes: null,
          status: "approved",
          created_at: "2026-10-01T00:00:00.000Z",
          reviewed_at: "2026-10-05T00:00:00.000Z",
        },
        {
          id: 8,
          name: "Test User",
          email: "test@example.com",
          lift_type: "Deadlift",
          weight_tier: 315,
          video_url: "",
          notes: null,
          status: "approved",
          created_at: "2026-10-10T00:00:00.000Z",
          reviewed_at: "2026-10-15T00:00:00.000Z",
        },
        {
          id: 9,
          name: "Test User",
          email: "test@example.com",
          lift_type: "Deadlift",
          weight_tier: 600,
          video_url: "",
          notes: null,
          status: "pending",
          created_at: "2026-10-16T00:00:00.000Z",
          reviewed_at: null,
        },
        {
          id: 10,
          name: "Test User",
          email: "test@example.com",
          lift_type: "Bench Press",
          weight_tier: 700,
          video_url: "",
          notes: null,
          status: "approved",
          created_at: "2026-10-16T00:00:00.000Z",
          reviewed_at: "2026-10-16T00:00:00.000Z",
        },
      ],
    );
    render(<MyBenchClub />);

    const heading = await screen.findByRole("heading", { name: "Deadlift Tier Ladder" });
    const section = heading.closest("section");
    if (!section) throw new Error("Deadlift tier ladder was not rendered.");

    expect(within(section).getByText("Current: 315 lbs")).toBeInTheDocument();
    expect(within(section).getAllByText("★ Current")).toHaveLength(1);
    expect(within(section).getAllByText("✓ Unlocked")).toHaveLength(2);

    const productsHeading = screen.getByRole("heading", { name: "Deadlift Tier Products" });
    const productsSection = productsHeading.closest("section");
    if (!productsSection) throw new Error("Deadlift products section was not rendered.");

    expect(within(productsSection).getByText("3 / 6 unlocked")).toBeInTheDocument();
  });
});

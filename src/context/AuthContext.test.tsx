import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

function AuthState() {
  const { user, loading } = useAuth();
  return <div>{loading ? "loading" : user ? user.email : "signed-out"}</div>;
}

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("AuthProvider session restoration", () => {
  it("clears an expired stored session instead of restoring its cached user", async () => {
    localStorage.setItem("auth_token", "expired-token");
    localStorage.setItem("auth_user", JSON.stringify({
      id: 1,
      name: "Test User",
      email: "test@example.com",
      role: "customer",
    }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
    }));

    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    );

    expect(await screen.findByText("signed-out")).toBeInTheDocument();
    await waitFor(() => {
      expect(localStorage.getItem("auth_token")).toBeNull();
      expect(localStorage.getItem("auth_user")).toBeNull();
    });
  });

  it("restores the backend's current user when the stored token is valid", async () => {
    localStorage.setItem("auth_token", "valid-token");
    localStorage.setItem("auth_user", JSON.stringify({
      id: 1,
      name: "Cached Name",
      email: "cached@example.com",
      role: "customer",
    }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        data: {
          user: {
            id: 1,
            name: "Current Name",
            email: "current@example.com",
            role: "customer",
          },
        },
      }),
    }));

    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    );

    expect(await screen.findByText("current@example.com")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("auth_user") || "{}").name).toBe("Current Name");
  });
});

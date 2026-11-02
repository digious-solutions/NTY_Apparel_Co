import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

function AuthState() {
  const { user, loading } = useAuth();
  return <div>{loading ? "loading" : user ? user.email : "signed-out"}</div>;
}

function ClaimAccountButton() {
  const { claimAccount } = useAuth();
  return <button onClick={() => void claimAccount("applicant@example.com", "123456", "securepass")}>Create account</button>;
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

  it("stores the authenticated session after an imported account is claimed", async () => {
    const claimedUser = {
      id: 8,
      name: "Imported Applicant",
      email: "applicant@example.com",
      role: "customer",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { user: claimedUser, token: "claimed-token" },
      }),
    }));

    render(
      <AuthProvider>
        <AuthState />
        <ClaimAccountButton />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("applicant@example.com")).toBeInTheDocument();
    await waitFor(() => {
      expect(localStorage.getItem("auth_token")).toBe("claimed-token");
      expect(JSON.parse(localStorage.getItem("auth_user") || "{}")).toEqual(claimedUser);
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/claim-account"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "applicant@example.com",
          otp: "123456",
          password: "securepass",
        }),
      }),
    );
  });
});

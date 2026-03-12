import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    inviteLink: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/app/(auth)/sign-up/[token]/sign-up-form", () => ({
  SignUpForm: ({ token }: { token: string }) =>
    React.createElement("div", { "data-testid": "sign-up-form", "data-token": token }),
}));

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SignUpPage from "@/app/(auth)/sign-up/[token]/page";
import { SignUpForm } from "@/app/(auth)/sign-up/[token]/sign-up-form";

const TOKEN = "test-token";
const makeParams = (token: string) => Promise.resolve({ token });
const futureDate = () => new Date(Date.now() + 86_400_000);
const pastDate = () => new Date(Date.now() - 86_400_000);

describe("SignUpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to / when token is not found", async () => {
    (prisma.inviteLink.findUnique as any).mockResolvedValue(null);

    await SignUpPage({ params: makeParams(TOKEN) });

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("redirects to / when invite is already redeemed", async () => {
    (prisma.inviteLink.findUnique as any).mockResolvedValue({
      token: TOKEN,
      usedAt: new Date("2026-01-01"),
      expiresAt: futureDate(),
    });

    await SignUpPage({ params: makeParams(TOKEN) });

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("redirects to / when invite is expired", async () => {
    (prisma.inviteLink.findUnique as any).mockResolvedValue({
      token: TOKEN,
      usedAt: null,
      expiresAt: pastDate(),
    });

    await SignUpPage({ params: makeParams(TOKEN) });

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders SignUpForm for a valid token", async () => {
    (prisma.inviteLink.findUnique as any).mockResolvedValue({
      token: TOKEN,
      usedAt: null,
      expiresAt: futureDate(),
    });

    const result = await SignUpPage({ params: makeParams(TOKEN) });

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toEqual(React.createElement(SignUpForm, { token: TOKEN }));
  });

  it("queries the DB with the token from the URL", async () => {
    (prisma.inviteLink.findUnique as any).mockResolvedValue(null);

    await SignUpPage({ params: makeParams("specific-token-123") });

    expect(prisma.inviteLink.findUnique).toHaveBeenCalledWith({
      where: { token: "specific-token-123" },
    });
  });
});

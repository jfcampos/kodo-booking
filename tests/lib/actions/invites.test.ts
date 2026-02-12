import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    inviteLink: {
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createInviteLink,
  listInviteLinks,
  deleteInviteLink,
} from "@/lib/actions/invites";

describe("createInviteLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an invite link with correct role and expiration", async () => {
    (auth as any).mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    (prisma.inviteLink.create as any).mockResolvedValue({
      id: "inv1",
      token: "abc123",
      role: "MEMBER",
      expiresAt: new Date(),
    });

    const result = await createInviteLink({
      role: "MEMBER",
      expiresInDays: 7,
    });

    expect(prisma.inviteLink.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: "MEMBER",
      }),
    });
    expect(result).toHaveProperty("token");
  });

  it("rejects non-admin users", async () => {
    (auth as any).mockResolvedValue({ user: { id: "2", role: "MEMBER" } });
    await expect(
      createInviteLink({ role: "MEMBER", expiresInDays: 7 })
    ).rejects.toThrow();
  });
});

describe("listInviteLinks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invite links for admins", async () => {
    (auth as any).mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    (prisma.inviteLink.findMany as any).mockResolvedValue([]);

    const result = await listInviteLinks();
    expect(prisma.inviteLink.findMany).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("rejects non-admin users", async () => {
    (auth as any).mockResolvedValue({ user: { id: "2", role: "VIEWER" } });
    await expect(listInviteLinks()).rejects.toThrow();
  });
});

describe("deleteInviteLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes an invite link for admins", async () => {
    (auth as any).mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    (prisma.inviteLink.delete as any).mockResolvedValue({});

    await deleteInviteLink("inv1");
    expect(prisma.inviteLink.delete).toHaveBeenCalledWith({
      where: { id: "inv1" },
    });
  });
});

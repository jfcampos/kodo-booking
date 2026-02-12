import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { listUsers, changeUserRole, removeUser } from "@/lib/actions/users";

describe("listUsers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns users for admins", async () => {
    (auth as any).mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    (prisma.user.findMany as any).mockResolvedValue([]);
    const result = await listUsers();
    expect(result).toEqual([]);
  });

  it("rejects non-admin", async () => {
    (auth as any).mockResolvedValue({ user: { id: "2", role: "MEMBER" } });
    await expect(listUsers()).rejects.toThrow("Unauthorized");
  });
});

describe("changeUserRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("changes role for another user", async () => {
    (auth as any).mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    (prisma.user.update as any).mockResolvedValue({});
    await changeUserRole("2", "VIEWER");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "2" },
      data: { role: "VIEWER" },
    });
  });

  it("rejects changing own role", async () => {
    (auth as any).mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    await expect(changeUserRole("1", "MEMBER")).rejects.toThrow(
      "Cannot change your own role"
    );
  });
});

describe("removeUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("removes another user", async () => {
    (auth as any).mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    (prisma.user.delete as any).mockResolvedValue({});
    await removeUser("2");
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "2" } });
  });

  it("rejects removing yourself", async () => {
    (auth as any).mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    await expect(removeUser("1")).rejects.toThrow("Cannot remove yourself");
  });
});

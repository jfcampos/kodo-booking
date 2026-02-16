"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

export async function googleSignUpWithInvite(token: string) {
  const t = await getTranslations("ServerErrors");

  const invite = await prisma.inviteLink.findUnique({
    where: { token },
  });
  if (!invite) throw new Error(t("invalidInvite"));
  if (invite.usedAt) throw new Error(t("inviteUsed"));
  if (invite.expiresAt < new Date()) throw new Error(t("inviteExpired"));

  const cookieStore = await cookies();
  cookieStore.set("kodo-invite-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  await signIn("google", { redirectTo: "/" });
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  token: string;
}) {
  const t = await getTranslations("ServerErrors");
  const parsed = registerSchema.parse(input);

  const invite = await prisma.inviteLink.findUnique({
    where: { token: parsed.token },
  });

  if (!invite) throw new Error(t("invalidInvite"));
  if (invite.usedAt) throw new Error(t("inviteUsed"));
  if (invite.expiresAt < new Date()) throw new Error(t("inviteExpired"));

  const existing = await prisma.user.findUnique({
    where: { email: parsed.email },
  });
  if (existing) throw new Error(t("emailRegistered"));

  const hashedPassword = await bcrypt.hash(parsed.password, 10);

  const user = await prisma.user.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      password: hashedPassword,
      role: invite.role,
    },
  });

  await prisma.inviteLink.update({
    where: { id: invite.id },
    data: { usedAt: new Date(), usedById: user.id },
  });

  return { success: true };
}

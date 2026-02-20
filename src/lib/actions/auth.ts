"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getColorForName } from "@/lib/colors";

export async function googleSignUpWithInvite(token: string): Promise<{ error: string } | void> {
  const t = await getTranslations("ServerErrors");

  const invite = await prisma.inviteLink.findUnique({
    where: { token },
  });
  if (!invite) return { error: t("invalidInvite") };
  if (invite.usedAt) return { error: t("inviteUsed") };
  if (invite.expiresAt < new Date()) return { error: t("inviteExpired") };

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
}): Promise<{ error: string } | { success: true }> {
  try {
    const t = await getTranslations("ServerErrors");
    const parsed = registerSchema.parse(input);

    const invite = await prisma.inviteLink.findUnique({
      where: { token: parsed.token },
    });

    if (!invite) return { error: t("invalidInvite") };
    if (invite.usedAt) return { error: t("inviteUsed") };
    if (invite.expiresAt < new Date()) return { error: t("inviteExpired") };

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
    });
    if (existing) return { error: t("emailRegistered") };

    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: hashedPassword,
        role: invite.role,
        color: getColorForName(parsed.name),
      },
    });

    await prisma.inviteLink.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedById: user.id },
    });

    return { success: true };
  } catch {
    return { error: "Unexpected error" };
  }
}

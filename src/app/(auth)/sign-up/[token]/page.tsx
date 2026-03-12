import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SignUpForm } from "./sign-up-form";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.inviteLink.findUnique({ where: { token } });

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    redirect("/");
  }

  return <SignUpForm token={token} />;
}

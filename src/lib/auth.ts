import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

export const IMPERSONATE_COOKIE = "kodo-impersonate";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role;
        session.user.id = token.id as string;

        // Impersonation: override session with target user if admin
        if (token.role === "ADMIN") {
          try {
            const cookieStore = await cookies();
            const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value;
            if (impersonateId && impersonateId !== token.id) {
              const target = await prisma.user.findUnique({
                where: { id: impersonateId },
                select: { id: true, name: true, email: true, role: true },
              });
              if (target) {
                session.user.id = target.id;
                session.user.name = target.name;
                session.user.email = target.email;
                session.user.role = target.role;
                (session as any).impersonatedBy = token.id as string;
              }
            }
          } catch {
            // cookies() may fail in certain contexts; ignore
          }
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // First user becomes admin
      const userCount = await prisma.user.count();
      if (userCount === 1) {
        await prisma.user.update({
          where: { id: user.id! },
          data: { role: "ADMIN" },
        });
      }
    },
  },
});

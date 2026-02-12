# Kodo Booking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a lightweight web app for managing reservations of shared rehearsal rooms with role-based access, conflict prevention, and a weekly calendar view.

**Architecture:** Next.js App Router full-stack app. Server Actions for mutations, RSCs for data fetching. Prisma ORM with PostgreSQL. Auth.js for authentication with middleware-based route protection.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Auth.js v5, Prisma, PostgreSQL (Neon), Zod

---

## Decisions

| Question | Decision |
|----------|----------|
| Database provider | **Neon** (serverless Postgres, free tier) |
| Google OAuth | **Not yet created** — plan includes setup guidance in Phase 3 |
| Deployment timing | **Early** — deploy to Vercel after Phase 1, preview deploys on every push |
| Package manager | **pnpm** |
| Design assets | **None** — sensible defaults, customize later |

---

## File Structure

```
src/
  app/
    (auth)/
      sign-in/page.tsx
      sign-up/[token]/page.tsx
    (app)/
      layout.tsx
      page.tsx                    # calendar (main page)
      history/page.tsx
      admin/
        layout.tsx
        page.tsx                  # admin dashboard
        users/page.tsx
        rooms/page.tsx
        bookings/page.tsx
        settings/page.tsx
    api/
      auth/[...nextauth]/route.ts
    layout.tsx
    globals.css
  lib/
    auth.ts                       # Auth.js config
    auth-client.ts                # client-side session hook
    prisma.ts                     # Prisma singleton
    validations/
      booking.ts
      room.ts
      invite.ts
      user.ts
      settings.ts
    actions/
      bookings.ts
      rooms.ts
      invites.ts
      users.ts
      settings.ts
    utils.ts                      # date helpers, cn(), etc.
  components/
    ui/                           # shadcn components (auto-generated)
    calendar/
      weekly-calendar.tsx
      day-column.tsx
      booking-block.tsx
      room-tabs.tsx
      booking-dialog.tsx
    admin/
      user-table.tsx
      room-form.tsx
      settings-form.tsx
      invite-dialog.tsx
      booking-table.tsx
    layout/
      header.tsx
      nav.tsx
      theme-toggle.tsx
      user-menu.tsx
  middleware.ts
prisma/
  schema.prisma
tests/
  lib/
    actions/
      bookings.test.ts
      rooms.test.ts
      invites.test.ts
      users.test.ts
    validations/
      booking.test.ts
  components/
    calendar/
      weekly-calendar.test.tsx
  e2e/
    auth.test.ts
    booking.test.ts
```

---

## Phase 1: Project Scaffold & Dev Environment

### Task 1.1: Create Next.js Project

**Step 1: Scaffold the project**

Run:
```bash
cd /Users/juanfcocampos/jfrepos/kodobooking
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

Accept defaults. This creates the Next.js 15 project with Tailwind v4, TypeScript, ESLint, App Router, and `src/` directory.

**Step 2: Verify it runs**

Run: `pnpm dev`
Expected: App running at http://localhost:3000

**Step 3: Initialize git and commit**

```bash
git init
git add -A
git commit -m "init: next.js 15 scaffold"
```

---

### Task 1.2: Install Core Dependencies

**Step 1: Install production deps**

```bash
pnpm add next-auth@5 @auth/prisma-adapter prisma @prisma/client zod bcryptjs date-fns nanoid
pnpm add -D @types/bcryptjs
```

**Step 2: Install dev/test deps**

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

**Step 3: Commit**

```bash
git add -A
git commit -m "deps: core packages"
```

---

### Task 1.3: Configure shadcn/ui

**Step 1: Initialize shadcn**

```bash
pnpm dlx shadcn@latest init
```

Select: New York style, Zinc base color, CSS variables = yes.

**Step 2: Add initial components**

```bash
pnpm dlx shadcn@latest add button card dialog input label select tabs toast dropdown-menu separator badge table form
```

**Step 3: Commit**

```bash
git add -A
git commit -m "ui: shadcn/ui init + base components"
```

---

### Task 1.4: Configure Vitest

**Step 1: Create vitest config**

Create: `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 2: Create test setup file**

Create: `tests/setup.ts`

```typescript
import "@testing-library/jest-dom/vitest";
```

**Step 3: Add test script to package.json**

Add to `scripts`:
```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 4: Run tests to verify config**

Run: `pnpm test:run`
Expected: "No test files found" (no error)

**Step 5: Commit**

```bash
git add -A
git commit -m "test: vitest config"
```

---

### Task 1.5: Create Utility Helpers

**Step 1: Create utils file**

Create: `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Note: shadcn init may have already created this. If so, keep the existing one.

**Step 2: Commit if changed**

```bash
git add -A
git commit -m "lib: utils helpers"
```

---

### Task 1.6: Deploy to Vercel

**Step 1: Push to GitHub**

```bash
gh repo create kodobooking --private --source=. --push
```

**Step 2: Deploy via Vercel CLI or dashboard**

```bash
pnpm add -g vercel
vercel
```

Follow prompts to link project.

**Step 3: Verify deployment**

Expected: Live URL accessible with default Next.js landing page.

**Step 4: Commit any Vercel config**

```bash
git add -A
git commit -m "deploy: vercel setup"
```

---

## Phase 2: Database Schema & Prisma Setup

### Task 2.1: Initialize Prisma

**Step 1: Init Prisma**

```bash
pnpm prisma init
```

This creates `prisma/schema.prisma` and `.env`.

**Step 2: Configure `.env` for Neon**

Add to `.env`:
```
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/kodobooking?sslmode=require"
```

User must create a Neon project at https://console.neon.tech and paste the connection string.

**Step 3: Add `.env` to `.gitignore`**

Verify `.env` is in `.gitignore` (Next.js scaffold should have it already). Create `.env.example`:

```
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"
AUTH_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

**Step 4: Commit**

```bash
git add -A
git commit -m "db: prisma init + env template"
```

---

### Task 2.2: Write Prisma Schema

**Step 1: Write the full schema**

Replace: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  MEMBER
  VIEWER
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          Role      @default(MEMBER)
  accounts      Account[]
  sessions      Session[]
  bookings      Booking[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Room {
  id                String             @id @default(cuid())
  name              String
  description       String?
  disabled          Boolean            @default(false)
  bookings          Booking[]
  blockedTimeRanges BlockedTimeRange[]
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

model Booking {
  id          String   @id @default(cuid())
  title       String
  notes       String?
  startTime   DateTime
  endTime     DateTime
  roomId      String
  room        Room     @relation(fields: [roomId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  recurringId String?
  cancelled   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([roomId, startTime, endTime])
  @@index([userId])
  @@index([recurringId])
}

model BlockedTimeRange {
  id        String   @id @default(cuid())
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id])
  startTime DateTime
  endTime   DateTime
  reason    String?
  createdAt DateTime @default(now())

  @@index([roomId, startTime, endTime])
}

model InviteLink {
  id        String    @id @default(cuid())
  role      Role
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  usedById  String?
  createdAt DateTime  @default(now())
}

model AppSettings {
  id                 String @id @default("default")
  granularityMinutes Int    @default(30)
  maxAdvanceDays     Int    @default(14)
  maxActiveBookings  Int    @default(3)
}
```

**Step 2: Generate client and run migration**

```bash
pnpm prisma migrate dev --name init
```

Expected: Migration created, client generated.

**Step 3: Commit**

```bash
git add -A
git commit -m "db: full prisma schema + init migration"
```

---

### Task 2.3: Create Prisma Client Singleton

**Step 1: Create Prisma client**

Create: `src/lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 2: Commit**

```bash
git add -A
git commit -m "db: prisma client singleton"
```

---

### Task 2.4: Seed Default AppSettings

**Step 1: Create seed file**

Create: `prisma/seed.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      granularityMinutes: 30,
      maxAdvanceDays: 14,
      maxActiveBookings: 3,
    },
  });
  console.log("Seeded default AppSettings");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

**Step 2: Add seed config to package.json**

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Install tsx: `pnpm add -D tsx`

**Step 3: Run seed**

```bash
pnpm prisma db seed
```

Expected: "Seeded default AppSettings"

**Step 4: Commit**

```bash
git add -A
git commit -m "db: seed default app settings"
```

---

## Phase 3: Authentication

### Task 3.1: Configure Auth.js

**Step 1: Generate AUTH_SECRET**

```bash
npx auth secret
```

Add output to `.env`.

**Step 2: Create auth config**

Create: `src/lib/auth.ts`

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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

        return { id: user.id, email: user.email, name: user.name, role: user.role };
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
      }
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth: auto-assign admin if first user
      if (account?.provider === "google") {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
          // Will be handled after creation via adapter
        }
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // First user becomes admin
      const userCount = await prisma.user.count();
      if (userCount === 1) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    },
  },
});
```

**Step 3: Extend Auth.js types**

Create: `src/types/next-auth.d.ts`

```typescript
import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    id: string;
  }
}
```

**Step 4: Create route handler**

Create: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

**Step 5: Commit**

```bash
git add -A
git commit -m "auth: auth.js config with google + credentials"
```

---

### Task 3.2: Auth Middleware

**Step 1: Create middleware**

Create: `src/middleware.ts`

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/sign-in", "/sign-up"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Allow auth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Require auth for everything else
  if (!req.auth) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && req.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 2: Commit**

```bash
git add -A
git commit -m "auth: route protection middleware"
```

---

### Task 3.3: Sign-In Page

**Step 1: Create sign-in page**

Create: `src/app/(auth)/sign-in/page.tsx`

```tsx
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Kodo Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button variant="outline" className="w-full" type="submit">
              Sign in with Google
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirectTo: "/",
              });
            }}
            className="space-y-3"
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button className="w-full" type="submit">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Create auth layout (minimal, no nav)**

Create: `src/app/(auth)/layout.tsx`

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "auth: sign-in page"
```

---

### Task 3.4: Sign-Up via Invite Link

**Step 1: Create Zod validation for registration**

Create: `src/lib/validations/user.ts`

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  token: z.string().min(1, "Invite token is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

**Step 2: Create register server action**

Create: `src/lib/actions/auth.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";

export async function register(input: { name: string; email: string; password: string; token: string }) {
  const parsed = registerSchema.parse(input);

  // Validate invite token
  const invite = await prisma.inviteLink.findUnique({
    where: { token: parsed.token },
  });

  if (!invite) throw new Error("Invalid invite link");
  if (invite.usedAt) throw new Error("Invite link already used");
  if (invite.expiresAt < new Date()) throw new Error("Invite link expired");

  // Check email uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: parsed.email },
  });
  if (existing) throw new Error("Email already registered");

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
```

**Step 3: Create sign-up page**

Create: `src/app/(auth)/sign-up/[token]/page.tsx`

```tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/lib/actions/auth";

export default function SignUpPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      await register({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        token,
      });
      router.push("/sign-in");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "auth: invite-based registration"
```

---

### Task 3.5: App Layout with Session

**Step 1: Create app layout with header**

Create: `src/components/layout/header.tsx`

```tsx
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function Header() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          Kodo Booking
        </Link>
        <div className="flex items-center gap-4">
          {session.user.role === "ADMIN" && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">Admin</Button>
            </Link>
          )}
          <Link href="/history">
            <Button variant="ghost" size="sm">History</Button>
          </Link>
          <span className="text-sm text-muted-foreground">{session.user.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/sign-in" });
            }}
          >
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Create app group layout**

Create: `src/app/(app)/layout.tsx`

```tsx
import { Header } from "@/components/layout/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
```

**Step 3: Create placeholder main page**

Create: `src/app/(app)/page.tsx`

```tsx
export default function HomePage() {
  return <div>Calendar coming soon</div>;
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "layout: app shell with header + auth"
```

---

### Task 3.6: Google OAuth Setup Guide

This is a manual step for the developer:

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project (or use existing)
3. Configure OAuth consent screen (External, add app name + email)
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Also add Vercel URL: `https://your-app.vercel.app/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env`:

```
AUTH_GOOGLE_ID="your-client-id"
AUTH_GOOGLE_SECRET="your-client-secret"
```

**Step 1: Test sign-in flow**

Run: `pnpm dev`, navigate to `/sign-in`, click "Sign in with Google"
Expected: OAuth flow completes, redirected to `/`, first user becomes ADMIN

**Step 2: Commit env example update**

```bash
git add -A
git commit -m "docs: google oauth env vars"
```

---

## Phase 4: Invite System & User Management

### Task 4.1: Invite Link Validation & Actions

**Step 1: Write failing test for invite creation**

Create: `tests/lib/actions/invites.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    inviteLink: {
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createInviteLink, listInviteLinks } from "@/lib/actions/invites";

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

    const result = await createInviteLink({ role: "MEMBER", expiresInDays: 7 });

    expect(prisma.inviteLink.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: "MEMBER",
      }),
    });
    expect(result).toHaveProperty("token");
  });

  it("rejects non-admin users", async () => {
    (auth as any).mockResolvedValue({ user: { id: "2", role: "MEMBER" } });
    await expect(createInviteLink({ role: "MEMBER", expiresInDays: 7 })).rejects.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:run tests/lib/actions/invites.test.ts`
Expected: FAIL — module not found

**Step 3: Create invite validation schema**

Create: `src/lib/validations/invite.ts`

```typescript
import { z } from "zod";
import { Role } from "@prisma/client";

export const createInviteSchema = z.object({
  role: z.enum(["MEMBER", "VIEWER"]),
  expiresInDays: z.number().min(1).max(30),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
```

**Step 4: Create invite server actions**

Create: `src/lib/actions/invites.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createInviteSchema } from "@/lib/validations/invite";
import { nanoid } from "nanoid";
import { addDays } from "date-fns";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function createInviteLink(input: { role: "MEMBER" | "VIEWER"; expiresInDays: number }) {
  await requireAdmin();
  const parsed = createInviteSchema.parse(input);

  const invite = await prisma.inviteLink.create({
    data: {
      role: parsed.role,
      token: nanoid(),
      expiresAt: addDays(new Date(), parsed.expiresInDays),
    },
  });

  return invite;
}

export async function listInviteLinks() {
  await requireAdmin();
  return prisma.inviteLink.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteInviteLink(id: string) {
  await requireAdmin();
  await prisma.inviteLink.delete({ where: { id } });
}
```

**Step 5: Run tests**

Run: `pnpm test:run tests/lib/actions/invites.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: invite link creation + validation"
```

---

### Task 4.2: User Management Actions

**Step 1: Create user actions**

Create: `src/lib/actions/users.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function listUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function changeUserRole(userId: string, role: Role) {
  const admin = await requireAdmin();
  if (admin.id === userId) throw new Error("Cannot change your own role");
  await prisma.user.update({ where: { id: userId }, data: { role } });
}

export async function removeUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) throw new Error("Cannot remove yourself");
  await prisma.user.delete({ where: { id: userId } });
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: user management actions"
```

---

### Task 4.3: Admin Users Page

**Step 1: Create user table component**

Create: `src/components/admin/user-table.tsx`

```tsx
"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { changeUserRole, removeUser } from "@/lib/actions/users";

type User = { id: string; name: string | null; email: string; role: Role; createdAt: Date };

export function UserTable({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleRoleChange(userId: string, role: Role) {
    setLoading(userId);
    try {
      await changeUserRole(userId, role);
    } finally {
      setLoading(null);
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this user?")) return;
    setLoading(userId);
    try {
      await removeUser(userId);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name ?? "—"}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              {user.id === currentUserId ? (
                <Badge>{user.role}</Badge>
              ) : (
                <Select
                  defaultValue={user.role}
                  onValueChange={(v) => handleRoleChange(user.id, v as Role)}
                  disabled={loading === user.id}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </TableCell>
            <TableCell>
              {user.id !== currentUserId && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemove(user.id)}
                  disabled={loading === user.id}
                >
                  Remove
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

Note: Import `Badge` from `@/components/ui/badge`.

**Step 2: Create admin users page**

Create: `src/app/(app)/admin/users/page.tsx`

```tsx
import { auth } from "@/lib/auth";
import { listUsers } from "@/lib/actions/users";
import { UserTable } from "@/components/admin/user-table";

export default async function AdminUsersPage() {
  const session = await auth();
  const users = await listUsers();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <UserTable users={users} currentUserId={session!.user.id} />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: admin users page"
```

---

### Task 4.4: Invite Link UI

**Step 1: Create invite dialog component**

Create: `src/components/admin/invite-dialog.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInviteLink } from "@/lib/actions/invites";

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(formData: FormData) {
    setLoading(true);
    try {
      const invite = await createInviteLink({
        role: formData.get("role") as "MEMBER" | "VIEWER",
        expiresInDays: Number(formData.get("expiresInDays")),
      });
      const url = `${window.location.origin}/sign-up/${invite.token}`;
      setLink(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setLink(null); }}>
      <DialogTrigger asChild>
        <Button>Generate Invite Link</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Invite Link</DialogTitle>
        </DialogHeader>
        {link ? (
          <div className="space-y-2">
            <Label>Share this link:</Label>
            <Input value={link} readOnly onClick={(e) => (e.target as HTMLInputElement).select()} />
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(link)}>
              Copy
            </Button>
          </div>
        ) : (
          <form action={handleCreate} className="space-y-3">
            <div>
              <Label>Role</Label>
              <Select name="role" defaultValue="MEMBER">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expires in (days)</Label>
              <Input name="expiresInDays" type="number" defaultValue={7} min={1} max={30} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Add InviteDialog to admin users page**

Modify: `src/app/(app)/admin/users/page.tsx` — add `<InviteDialog />` above the UserTable.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: invite link generation UI"
```

---

## Phase 5: Room Management

### Task 5.1: Room Validation & Actions

**Step 1: Create room validation schema**

Create: `src/lib/validations/room.ts`

```typescript
import { z } from "zod";

export const roomSchema = z.object({
  name: z.string().min(1, "Room name is required").max(100),
  description: z.string().max(500).optional(),
});

export const blockedTimeRangeSchema = z.object({
  roomId: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  reason: z.string().max(200).optional(),
}).refine((d) => d.endTime > d.startTime, {
  message: "End time must be after start time",
});

export type RoomInput = z.infer<typeof roomSchema>;
export type BlockedTimeRangeInput = z.infer<typeof blockedTimeRangeSchema>;
```

**Step 2: Create room server actions**

Create: `src/lib/actions/rooms.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { roomSchema, blockedTimeRangeSchema } from "@/lib/validations/room";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function createRoom(input: { name: string; description?: string }) {
  await requireAdmin();
  const parsed = roomSchema.parse(input);
  const room = await prisma.room.create({ data: parsed });
  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return room;
}

export async function updateRoom(id: string, input: { name: string; description?: string }) {
  await requireAdmin();
  const parsed = roomSchema.parse(input);
  const room = await prisma.room.update({ where: { id }, data: parsed });
  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return room;
}

export async function toggleRoomDisabled(id: string) {
  await requireAdmin();
  const room = await prisma.room.findUniqueOrThrow({ where: { id } });
  await prisma.room.update({ where: { id }, data: { disabled: !room.disabled } });
  revalidatePath("/admin/rooms");
  revalidatePath("/");
}

export async function listRooms(includeDisabled = false) {
  const where = includeDisabled ? {} : { disabled: false };
  return prisma.room.findMany({ where, orderBy: { createdAt: "asc" } });
}

export async function createBlockedTimeRange(input: {
  roomId: string;
  startTime: Date;
  endTime: Date;
  reason?: string;
}) {
  await requireAdmin();
  const parsed = blockedTimeRangeSchema.parse(input);
  const blocked = await prisma.blockedTimeRange.create({ data: parsed });
  revalidatePath("/");
  return blocked;
}

export async function deleteBlockedTimeRange(id: string) {
  await requireAdmin();
  await prisma.blockedTimeRange.delete({ where: { id } });
  revalidatePath("/");
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: room CRUD + blocked time ranges"
```

---

### Task 5.2: Admin Rooms Page

**Step 1: Create room form component**

Create: `src/components/admin/room-form.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoom, updateRoom } from "@/lib/actions/rooms";

type Room = { id: string; name: string; description: string | null } | null;

export function RoomFormDialog({ room, trigger }: { room?: Room; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!room;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const data = {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
      };
      if (isEdit) {
        await updateRoom(room!.id, data);
      } else {
        await createRoom(data);
      }
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Room" : "Add Room"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input name="name" defaultValue={room?.name ?? ""} required />
          </div>
          <div>
            <Label>Description</Label>
            <Input name="description" defaultValue={room?.description ?? ""} />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Create admin rooms page**

Create: `src/app/(app)/admin/rooms/page.tsx`

```tsx
import { listRooms, toggleRoomDisabled } from "@/lib/actions/rooms";
import { RoomFormDialog } from "@/components/admin/room-form";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminRoomsPage() {
  const rooms = await listRooms(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <RoomFormDialog trigger={<Button>Add Room</Button>} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map((room) => (
            <TableRow key={room.id}>
              <TableCell className="font-medium">{room.name}</TableCell>
              <TableCell>{room.description ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={room.disabled ? "secondary" : "default"}>
                  {room.disabled ? "Disabled" : "Active"}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-2">
                <RoomFormDialog
                  room={room}
                  trigger={<Button variant="outline" size="sm">Edit</Button>}
                />
                <form action={async () => { "use server"; await toggleRoomDisabled(room.id); }}>
                  <Button variant="outline" size="sm" type="submit">
                    {room.disabled ? "Enable" : "Disable"}
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: admin rooms page"
```

---

## Phase 6: Booking Engine (Core Logic)

### Task 6.1: Booking Validation Schema

**Step 1: Write failing test**

Create: `tests/lib/validations/booking.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { bookingSchema } from "@/lib/validations/booking";

describe("bookingSchema", () => {
  it("accepts valid booking input", () => {
    const result = bookingSchema.safeParse({
      title: "Band practice",
      roomId: "room1",
      startTime: new Date("2026-03-01T10:00:00Z"),
      endTime: new Date("2026-03-01T11:00:00Z"),
    });
    expect(result.success).toBe(true);
  });

  it("rejects end time before start time", () => {
    const result = bookingSchema.safeParse({
      title: "Bad booking",
      roomId: "room1",
      startTime: new Date("2026-03-01T11:00:00Z"),
      endTime: new Date("2026-03-01T10:00:00Z"),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = bookingSchema.safeParse({
      title: "",
      roomId: "room1",
      startTime: new Date("2026-03-01T10:00:00Z"),
      endTime: new Date("2026-03-01T11:00:00Z"),
    });
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:run tests/lib/validations/booking.test.ts`
Expected: FAIL

**Step 3: Create booking validation schema**

Create: `src/lib/validations/booking.ts`

```typescript
import { z } from "zod";

export const bookingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  notes: z.string().max(1000).optional(),
  roomId: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
}).refine((d) => d.endTime > d.startTime, {
  message: "End time must be after start time",
});

export const editBookingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  notes: z.string().max(1000).optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type EditBookingInput = z.infer<typeof editBookingSchema>;
```

**Step 4: Run test**

Run: `pnpm test:run tests/lib/validations/booking.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: booking zod validation"
```

---

### Task 6.2: Booking Creation with Conflict Prevention

**Step 1: Write failing test for conflict detection**

Create: `tests/lib/actions/bookings.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    booking: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    blockedTimeRange: {
      findFirst: vi.fn(),
    },
    appSettings: {
      findUniqueOrThrow: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

describe("booking conflict detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({ user: { id: "user1", role: "MEMBER" } });
    (prisma.appSettings.findUniqueOrThrow as any).mockResolvedValue({
      granularityMinutes: 30,
      maxAdvanceDays: 14,
      maxActiveBookings: 3,
    });
  });

  it("prevents overlapping bookings on the same room", async () => {
    // This test validates the conflict query logic
    // The actual implementation uses a transaction with a conflict check
    const start = new Date("2026-03-01T10:00:00Z");
    const end = new Date("2026-03-01T11:00:00Z");

    // Simulate existing booking
    (prisma.booking.findFirst as any).mockResolvedValue({ id: "existing" });

    const { createBooking } = await import("@/lib/actions/bookings");

    await expect(
      createBooking({
        title: "Overlap test",
        roomId: "room1",
        startTime: start,
        endTime: end,
      })
    ).rejects.toThrow("conflict");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:run tests/lib/actions/bookings.test.ts`
Expected: FAIL

**Step 3: Create booking server actions**

Create: `src/lib/actions/bookings.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bookingSchema, editBookingSchema } from "@/lib/validations/booking";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

async function requireRole(roles: string[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) throw new Error("Unauthorized");
  return user;
}

async function getSettings() {
  return prisma.appSettings.findUniqueOrThrow({ where: { id: "default" } });
}

export async function createBooking(input: {
  title: string;
  notes?: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
}) {
  const user = await requireAuth();
  if (user.role === "VIEWER") throw new Error("Viewers cannot create bookings");

  const parsed = bookingSchema.parse(input);
  const settings = await getSettings();

  // Validate granularity alignment
  const granMs = settings.granularityMinutes * 60 * 1000;
  if (parsed.startTime.getTime() % granMs !== 0 || parsed.endTime.getTime() % granMs !== 0) {
    throw new Error(`Times must align to ${settings.granularityMinutes}-minute increments`);
  }

  // Validate advance window
  const maxDate = addDays(new Date(), settings.maxAdvanceDays);
  if (parsed.startTime > maxDate) {
    throw new Error(`Cannot book more than ${settings.maxAdvanceDays} days in advance`);
  }

  // Validate start is in the future
  if (parsed.startTime <= new Date()) {
    throw new Error("Cannot book in the past");
  }

  // Check active bookings limit
  const activeCount = await prisma.booking.count({
    where: {
      userId: user.id,
      cancelled: false,
      endTime: { gt: new Date() },
    },
  });
  if (activeCount >= settings.maxActiveBookings) {
    throw new Error(`Maximum ${settings.maxActiveBookings} active bookings allowed`);
  }

  // Check for conflicts (overlapping bookings on same room)
  const conflict = await prisma.booking.findFirst({
    where: {
      roomId: parsed.roomId,
      cancelled: false,
      startTime: { lt: parsed.endTime },
      endTime: { gt: parsed.startTime },
    },
  });
  if (conflict) throw new Error("Time slot conflict: another booking overlaps this time");

  // Check for blocked time ranges
  const blocked = await prisma.blockedTimeRange.findFirst({
    where: {
      roomId: parsed.roomId,
      startTime: { lt: parsed.endTime },
      endTime: { gt: parsed.startTime },
    },
  });
  if (blocked) throw new Error("This time range is blocked");

  const booking = await prisma.booking.create({
    data: {
      title: parsed.title,
      notes: parsed.notes,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      roomId: parsed.roomId,
      userId: user.id,
    },
  });

  revalidatePath("/");
  return booking;
}

export async function cancelBooking(bookingId: string) {
  const user = await requireAuth();
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });

  if (booking.userId !== user.id && user.role !== "ADMIN") {
    throw new Error("Can only cancel your own bookings");
  }
  if (booking.startTime <= new Date()) {
    throw new Error("Cannot cancel a booking that has already started");
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { cancelled: true },
  });

  revalidatePath("/");
}

export async function editBooking(bookingId: string, input: { title: string; notes?: string }) {
  const user = await requireAuth();
  const parsed = editBookingSchema.parse(input);
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });

  if (booking.userId !== user.id && user.role !== "ADMIN") {
    throw new Error("Can only edit your own bookings");
  }
  if (booking.startTime <= new Date()) {
    throw new Error("Cannot edit a past booking");
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { title: parsed.title, notes: parsed.notes },
  });

  revalidatePath("/");
  revalidatePath("/history");
}

export async function adminCancelBooking(bookingId: string) {
  await requireRole(["ADMIN"]);
  await prisma.booking.update({
    where: { id: bookingId },
    data: { cancelled: true },
  });
  revalidatePath("/");
}

export async function getBookingsForWeek(roomId: string, weekStart: Date, weekEnd: Date) {
  await requireAuth();
  return prisma.booking.findMany({
    where: {
      roomId,
      cancelled: false,
      startTime: { gte: weekStart },
      endTime: { lte: weekEnd },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { startTime: "asc" },
  });
}

export async function getBlockedRangesForWeek(roomId: string, weekStart: Date, weekEnd: Date) {
  await requireAuth();
  return prisma.blockedTimeRange.findMany({
    where: {
      roomId,
      startTime: { lt: weekEnd },
      endTime: { gt: weekStart },
    },
    orderBy: { startTime: "asc" },
  });
}
```

**Step 4: Run tests**

Run: `pnpm test:run tests/lib/actions/bookings.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: booking engine with conflict prevention"
```

---

### Task 6.3: Recurring Bookings (Admin Only)

**Step 1: Create recurring booking action**

Add to `src/lib/actions/bookings.ts`:

```typescript
export async function createRecurringBooking(input: {
  title: string;
  notes?: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  recurrenceWeeks: number; // how many weeks to repeat
}) {
  await requireRole(["ADMIN"]);
  const user = await requireAuth();
  const { recurrenceWeeks, ...bookingInput } = input;
  const parsed = bookingSchema.parse(bookingInput);

  const recurringId = crypto.randomUUID();
  const bookings = [];

  for (let week = 0; week < recurrenceWeeks; week++) {
    const start = new Date(parsed.startTime.getTime() + week * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(parsed.endTime.getTime() + week * 7 * 24 * 60 * 60 * 1000);

    // Check conflict for each instance
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId: parsed.roomId,
        cancelled: false,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (conflict) {
      throw new Error(`Conflict on week ${week + 1}: ${start.toISOString()}`);
    }

    bookings.push({
      title: parsed.title,
      notes: parsed.notes,
      startTime: start,
      endTime: end,
      roomId: parsed.roomId,
      userId: user.id,
      recurringId,
    });
  }

  await prisma.booking.createMany({ data: bookings });
  revalidatePath("/");
  return { recurringId, count: bookings.length };
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: recurring bookings (admin)"
```

---

## Phase 7: Weekly Calendar UI

### Task 7.1: Room Tabs Component

**Step 1: Create room tabs**

Create: `src/components/calendar/room-tabs.tsx`

```tsx
"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Room = { id: string; name: string };

export function RoomTabs({
  rooms,
  selectedRoomId,
  onSelect,
}: {
  rooms: Room[];
  selectedRoomId: string;
  onSelect: (roomId: string) => void;
}) {
  return (
    <Tabs value={selectedRoomId} onValueChange={onSelect}>
      <TabsList>
        {rooms.map((room) => (
          <TabsTrigger key={room.id} value={room.id}>
            {room.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "ui: room tabs component"
```

---

### Task 7.2: Weekly Calendar Grid

**Step 1: Create date utility helpers**

Add to `src/lib/utils.ts`:

```typescript
import { startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, format } from "date-fns";

export function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
  return { start, end };
}

export function getWeekDays(date: Date) {
  const { start, end } = getWeekRange(date);
  return eachDayOfInterval({ start, end });
}

export function nextWeek(date: Date) {
  return addWeeks(date, 1);
}

export function prevWeek(date: Date) {
  return subWeeks(date, 1);
}

export function formatTime(date: Date) {
  return format(date, "HH:mm");
}

export function formatDayHeader(date: Date) {
  return format(date, "EEE d");
}
```

**Step 2: Create booking block component**

Create: `src/components/calendar/booking-block.tsx`

```tsx
"use client";

type BookingBlockProps = {
  title: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  isOwn: boolean;
  onClick: () => void;
};

export function BookingBlock({ title, userName, startTime, endTime, isOwn, onClick }: BookingBlockProps) {
  const startHour = startTime.getHours() + startTime.getMinutes() / 60;
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  return (
    <button
      onClick={onClick}
      className={`absolute left-0 right-0 mx-1 rounded px-2 py-1 text-xs overflow-hidden ${
        isOwn
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground"
      }`}
      style={{
        top: `${(startHour) * 4}rem`,
        height: `${duration * 4}rem`,
      }}
    >
      <div className="font-medium truncate">{title}</div>
      <div className="truncate opacity-75">{userName}</div>
    </button>
  );
}
```

**Step 3: Create day column component**

Create: `src/components/calendar/day-column.tsx`

```tsx
"use client";

import { BookingBlock } from "./booking-block";
import { formatDayHeader } from "@/lib/utils";

type Booking = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  user: { id: string; name: string | null };
};

type DayColumnProps = {
  date: Date;
  bookings: Booking[];
  currentUserId: string;
  granularityMinutes: number;
  onSlotClick: (date: Date, hour: number) => void;
  onBookingClick: (bookingId: string) => void;
};

export function DayColumn({
  date,
  bookings,
  currentUserId,
  granularityMinutes,
  onSlotClick,
  onBookingClick,
}: DayColumnProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const slotsPerHour = 60 / granularityMinutes;
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="flex-1 min-w-0">
      <div className={`sticky top-0 z-10 border-b bg-background p-2 text-center text-sm font-medium ${
        isToday ? "text-primary" : ""
      }`}>
        {formatDayHeader(date)}
      </div>
      <div className="relative">
        {hours.map((hour) =>
          Array.from({ length: slotsPerHour }, (_, slotIdx) => (
            <div
              key={`${hour}-${slotIdx}`}
              className="h-16 border-b border-r cursor-pointer hover:bg-muted/50"
              onClick={() => onSlotClick(date, hour + (slotIdx * granularityMinutes) / 60)}
            />
          ))
        )}
        {bookings.map((booking) => (
          <BookingBlock
            key={booking.id}
            title={booking.title}
            userName={booking.user.name ?? "Unknown"}
            startTime={new Date(booking.startTime)}
            endTime={new Date(booking.endTime)}
            isOwn={booking.user.id === currentUserId}
            onClick={() => onBookingClick(booking.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "ui: calendar day column + booking block"
```

---

### Task 7.3: Booking Dialog (Create/View/Edit)

**Step 1: Create booking dialog**

Create: `src/components/calendar/booking-dialog.tsx`

```tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBooking, cancelBooking, editBooking } from "@/lib/actions/bookings";
import { formatTime } from "@/lib/utils";

type BookingDialogProps = {
  mode: "create" | "view";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  startTime?: Date;
  endTime?: Date;
  booking?: {
    id: string;
    title: string;
    notes: string | null;
    startTime: Date;
    endTime: Date;
    user: { id: string; name: string | null };
  };
  currentUserId: string;
  currentUserRole: string;
  granularityMinutes: number;
};

export function BookingDialog({
  mode,
  open,
  onOpenChange,
  roomId,
  startTime,
  endTime,
  booking,
  currentUserId,
  currentUserRole,
  granularityMinutes,
}: BookingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwn = booking?.user.id === currentUserId;
  const isAdmin = currentUserRole === "ADMIN";
  const canEdit = isOwn || isAdmin;
  const canCancel = canEdit && booking && new Date(booking.startTime) > new Date();

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      await createBooking({
        title: formData.get("title") as string,
        notes: (formData.get("notes") as string) || undefined,
        roomId,
        startTime: startTime!,
        endTime: endTime!,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!booking || !confirm("Cancel this booking?")) return;
    setLoading(true);
    try {
      await cancelBooking(booking.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(formData: FormData) {
    if (!booking) return;
    setLoading(true);
    setError(null);
    try {
      await editBooking(booking.id, {
        title: formData.get("title") as string,
        notes: (formData.get("notes") as string) || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "create") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {startTime && formatTime(startTime)} – {endTime && formatTime(endTime)}
          </p>
          <form action={handleCreate} className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input name="title" placeholder="Band practice" required />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input name="notes" placeholder="Any details..." />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Booking..." : "Book"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // View/edit mode
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{booking?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            {booking && formatTime(new Date(booking.startTime))} –{" "}
            {booking && formatTime(new Date(booking.endTime))}
          </p>
          <p>Booked by: {booking?.user.name ?? "Unknown"}</p>
          {booking?.notes && <p>Notes: {booking.notes}</p>}
        </div>
        {canEdit && (
          <form action={handleEdit} className="space-y-3 border-t pt-3">
            <div>
              <Label>Title</Label>
              <Input name="title" defaultValue={booking?.title} required />
            </div>
            <div>
              <Label>Notes</Label>
              <Input name="notes" defaultValue={booking?.notes ?? ""} />
            </div>
            <Button type="submit" disabled={loading} variant="outline" className="w-full">
              Save Changes
            </Button>
          </form>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {canCancel && (
          <Button variant="destructive" onClick={handleCancel} disabled={loading} className="w-full">
            Cancel Booking
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "ui: booking dialog (create/view/edit/cancel)"
```

---

### Task 7.4: Weekly Calendar Main Component

**Step 1: Create weekly calendar**

Create: `src/components/calendar/weekly-calendar.tsx`

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RoomTabs } from "./room-tabs";
import { DayColumn } from "./day-column";
import { BookingDialog } from "./booking-dialog";
import { getWeekRange, getWeekDays, nextWeek, prevWeek, formatTime } from "@/lib/utils";
import { getBookingsForWeek, getBlockedRangesForWeek } from "@/lib/actions/bookings";
import { format } from "date-fns";

type Room = { id: string; name: string };
type Booking = {
  id: string;
  title: string;
  notes: string | null;
  startTime: Date;
  endTime: Date;
  user: { id: string; name: string | null; email: string };
};

type WeeklyCalendarProps = {
  rooms: Room[];
  currentUserId: string;
  currentUserRole: string;
  granularityMinutes: number;
};

export function WeeklyCalendar({
  rooms,
  currentUserId,
  currentUserRole,
  granularityMinutes,
}: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id ?? "");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: "create" | "view";
    startTime?: Date;
    endTime?: Date;
    booking?: Booking;
  }>({ open: false, mode: "create" });

  const { start: weekStart, end: weekEnd } = getWeekRange(currentDate);
  const days = getWeekDays(currentDate);

  const loadBookings = useCallback(async () => {
    if (!selectedRoomId) return;
    const data = await getBookingsForWeek(selectedRoomId, weekStart, weekEnd);
    setBookings(data as Booking[]);
  }, [selectedRoomId, weekStart.getTime(), weekEnd.getTime()]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function handleSlotClick(date: Date, hour: number) {
    if (currentUserRole === "VIEWER") return;
    const startTime = new Date(date);
    startTime.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
    const endTime = new Date(startTime.getTime() + granularityMinutes * 60 * 1000);
    setDialogState({ open: true, mode: "create", startTime, endTime });
  }

  function handleBookingClick(bookingId: string) {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setDialogState({ open: true, mode: "view", booking });
    }
  }

  function getBookingsForDay(date: Date) {
    return bookings.filter((b) => {
      const bookingDate = new Date(b.startTime).toDateString();
      return bookingDate === date.toDateString();
    });
  }

  return (
    <div className="space-y-4">
      {rooms.length > 1 && (
        <RoomTabs rooms={rooms} selectedRoomId={selectedRoomId} onSelect={setSelectedRoomId} />
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(prevWeek(currentDate))}>
          Prev
        </Button>
        <span className="font-medium">
          {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
        </span>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(nextWeek(currentDate))}>
          Next
        </Button>
      </div>

      <div className="flex overflow-x-auto">
        {/* Time gutter */}
        <div className="w-14 flex-shrink-0">
          <div className="h-10 border-b" /> {/* header spacer */}
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="h-16 pr-2 text-right text-xs text-muted-foreground">
              {String(i).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => (
          <DayColumn
            key={day.toISOString()}
            date={day}
            bookings={getBookingsForDay(day)}
            currentUserId={currentUserId}
            granularityMinutes={granularityMinutes}
            onSlotClick={handleSlotClick}
            onBookingClick={handleBookingClick}
          />
        ))}
      </div>

      <BookingDialog
        mode={dialogState.mode}
        open={dialogState.open}
        onOpenChange={(open) => {
          setDialogState((s) => ({ ...s, open }));
          if (!open) loadBookings(); // refresh after close
        }}
        roomId={selectedRoomId}
        startTime={dialogState.startTime}
        endTime={dialogState.endTime}
        booking={dialogState.booking}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        granularityMinutes={granularityMinutes}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "ui: weekly calendar main component"
```

---

### Task 7.5: Wire Calendar to Main Page

**Step 1: Update main page**

Replace: `src/app/(app)/page.tsx`

```tsx
import { auth } from "@/lib/auth";
import { listRooms } from "@/lib/actions/rooms";
import { prisma } from "@/lib/prisma";
import { WeeklyCalendar } from "@/components/calendar/weekly-calendar";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) return null;

  const rooms = await listRooms();
  const settings = await prisma.appSettings.findUniqueOrThrow({ where: { id: "default" } });

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>No rooms available.</p>
        {session.user.role === "ADMIN" && (
          <p>Go to <a href="/admin/rooms" className="underline">Admin → Rooms</a> to add one.</p>
        )}
      </div>
    );
  }

  return (
    <WeeklyCalendar
      rooms={rooms}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
      granularityMinutes={settings.granularityMinutes}
    />
  );
}
```

**Step 2: Verify app loads**

Run: `pnpm dev`
Expected: Calendar renders (empty) with room tabs and week navigation.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: wire calendar to main page"
```

---

## Phase 8: Admin Panel & Settings

### Task 8.1: Admin Layout & Navigation

**Step 1: Create admin layout**

Create: `src/app/(app)/admin/layout.tsx`

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <nav className="flex gap-2 border-b pb-2">
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button variant="ghost" size="sm">{link.label}</Button>
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
```

**Step 2: Create admin dashboard page**

Create: `src/app/(app)/admin/page.tsx`

```tsx
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [userCount, roomCount, activeBookings] = await Promise.all([
    prisma.user.count(),
    prisma.room.count({ where: { disabled: false } }),
    prisma.booking.count({ where: { cancelled: false, endTime: { gt: new Date() } } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{userCount}</div>
          <div className="text-sm text-muted-foreground">Users</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{roomCount}</div>
          <div className="text-sm text-muted-foreground">Active Rooms</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{activeBookings}</div>
          <div className="text-sm text-muted-foreground">Active Bookings</div>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: admin layout + dashboard"
```

---

### Task 8.2: Settings Page

**Step 1: Create settings validation**

Create: `src/lib/validations/settings.ts`

```typescript
import { z } from "zod";

export const settingsSchema = z.object({
  granularityMinutes: z.number().min(5).max(120),
  maxAdvanceDays: z.number().min(1).max(365),
  maxActiveBookings: z.number().min(1).max(50),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
```

**Step 2: Create settings action**

Create: `src/lib/actions/settings.ts`

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { settingsSchema } from "@/lib/validations/settings";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  return prisma.appSettings.findUniqueOrThrow({ where: { id: "default" } });
}

export async function updateSettings(input: {
  granularityMinutes: number;
  maxAdvanceDays: number;
  maxActiveBookings: number;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const parsed = settingsSchema.parse(input);
  await prisma.appSettings.update({
    where: { id: "default" },
    data: parsed,
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
}
```

**Step 3: Create settings form component**

Create: `src/components/admin/settings-form.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettings } from "@/lib/actions/settings";

type Settings = {
  granularityMinutes: number;
  maxAdvanceDays: number;
  maxActiveBookings: number;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setSaved(false);
    try {
      await updateSettings({
        granularityMinutes: Number(formData.get("granularityMinutes")),
        maxAdvanceDays: Number(formData.get("maxAdvanceDays")),
        maxActiveBookings: Number(formData.get("maxActiveBookings")),
      });
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="max-w-md space-y-4">
      <div>
        <Label>Time Slot Granularity (minutes)</Label>
        <Input name="granularityMinutes" type="number" defaultValue={settings.granularityMinutes} min={5} max={120} />
      </div>
      <div>
        <Label>Max Advance Booking (days)</Label>
        <Input name="maxAdvanceDays" type="number" defaultValue={settings.maxAdvanceDays} min={1} max={365} />
      </div>
      <div>
        <Label>Max Active Bookings Per User</Label>
        <Input name="maxActiveBookings" type="number" defaultValue={settings.maxActiveBookings} min={1} max={50} />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Settings"}
      </Button>
      {saved && <p className="text-sm text-green-600">Saved</p>}
    </form>
  );
}
```

**Step 4: Create settings page**

Create: `src/app/(app)/admin/settings/page.tsx`

```tsx
import { getSettings } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: admin settings page"
```

---

### Task 8.3: Admin Bookings Page

**Step 1: Create booking table component**

Create: `src/components/admin/booking-table.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { adminCancelBooking } from "@/lib/actions/bookings";
import { format } from "date-fns";

type Booking = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  cancelled: boolean;
  room: { name: string };
  user: { name: string | null; email: string };
};

export function BookingTable({ bookings }: { bookings: Booking[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this booking?")) return;
    setLoading(id);
    try {
      await adminCancelBooking(id);
    } finally {
      setLoading(null);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b) => (
          <TableRow key={b.id}>
            <TableCell>{b.title}</TableCell>
            <TableCell>{b.room.name}</TableCell>
            <TableCell>{b.user.name ?? b.user.email}</TableCell>
            <TableCell className="text-xs">
              {format(new Date(b.startTime), "MMM d HH:mm")} – {format(new Date(b.endTime), "HH:mm")}
            </TableCell>
            <TableCell>
              <Badge variant={b.cancelled ? "secondary" : new Date(b.endTime) < new Date() ? "outline" : "default"}>
                {b.cancelled ? "Cancelled" : new Date(b.endTime) < new Date() ? "Past" : "Active"}
              </Badge>
            </TableCell>
            <TableCell>
              {!b.cancelled && new Date(b.startTime) > new Date() && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancel(b.id)}
                  disabled={loading === b.id}
                >
                  Cancel
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Step 2: Create admin bookings page**

Create: `src/app/(app)/admin/bookings/page.tsx`

```tsx
import { prisma } from "@/lib/prisma";
import { BookingTable } from "@/components/admin/booking-table";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: {
      room: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { startTime: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Bookings</h1>
      <BookingTable bookings={bookings} />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: admin bookings page"
```

---

## Phase 9: Booking History & Member Views

### Task 9.1: User Booking History

**Step 1: Create history action**

Add to `src/lib/actions/bookings.ts`:

```typescript
export async function getUserBookingHistory() {
  const user = await requireAuth();
  return prisma.booking.findMany({
    where: { userId: user.id },
    include: { room: { select: { name: true } } },
    orderBy: { startTime: "desc" },
  });
}
```

**Step 2: Create history page**

Create: `src/app/(app)/history/page.tsx`

```tsx
import { getUserBookingHistory } from "@/lib/actions/bookings";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function HistoryPage() {
  const bookings = await getUserBookingHistory();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Booking History</h1>
      {bookings.length === 0 ? (
        <p className="text-muted-foreground">No bookings yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.title}</TableCell>
                <TableCell>{b.room.name}</TableCell>
                <TableCell className="text-xs">
                  {format(new Date(b.startTime), "MMM d HH:mm")} – {format(new Date(b.endTime), "HH:mm")}
                </TableCell>
                <TableCell>
                  <Badge variant={b.cancelled ? "secondary" : new Date(b.endTime) < new Date() ? "outline" : "default"}>
                    {b.cancelled ? "Cancelled" : new Date(b.endTime) < new Date() ? "Past" : "Upcoming"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: booking history page"
```

---

## Phase 10: Polish & Dark Mode

### Task 10.1: Dark Mode Setup

**Step 1: Install next-themes**

```bash
pnpm add next-themes
```

**Step 2: Create theme provider**

Create: `src/components/layout/theme-provider.tsx`

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
```

**Step 3: Create theme toggle**

Create: `src/components/layout/theme-toggle.tsx`

```tsx
"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </Button>
  );
}
```

**Step 4: Wrap root layout with ThemeProvider**

Modify: `src/app/layout.tsx` — wrap `{children}` with `<ThemeProvider>`.

**Step 5: Add ThemeToggle to Header**

Modify: `src/components/layout/header.tsx` — add `<ThemeToggle />` in the header's right section.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: dark mode with system preference"
```

---

### Task 10.2: Loading & Error States

**Step 1: Create loading.tsx files**

Create: `src/app/(app)/loading.tsx`

```tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
```

Create: `src/app/(app)/admin/loading.tsx` — same content.

**Step 2: Create error.tsx files**

Create: `src/app/(app)/error.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-destructive">Something went wrong</p>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

**Step 3: Create not-found.tsx**

Create: `src/app/not-found.tsx`

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Link href="/"><Button>Go home</Button></Link>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "ui: loading, error, and 404 states"
```

---

### Task 10.3: Accessibility & Responsive Pass

**Step 1: Audit and fix semantic HTML**

Review all pages and components. Ensure:
- All interactive elements are `<button>` or `<a>`
- Forms have proper `<label>` associations
- Tables have `<caption>` where appropriate
- Images have `alt` attributes
- Heading hierarchy is correct (h1 → h2 → h3)

**Step 2: Keyboard navigation**

- Verify all dialogs trap focus
- Verify Escape closes dialogs
- Verify Tab order is logical on calendar
- Verify Enter/Space activates buttons

**Step 3: Mobile calendar responsive fix**

Ensure the calendar's horizontal scroll works well on mobile. The day columns should be swipeable. Consider making the time gutter and headers sticky.

**Step 4: Commit**

```bash
git add -A
git commit -m "ui: a11y + responsive polish"
```

---

### Task 10.4: Final Deploy & Verify

**Step 1: Set env vars on Vercel**

In Vercel dashboard or CLI, set:
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

**Step 2: Push and deploy**

```bash
git push
```

Vercel auto-deploys from main.

**Step 3: Run Prisma migration on production**

```bash
pnpm prisma migrate deploy
pnpm prisma db seed
```

Or configure these in Vercel build command.

**Step 4: Smoke test**

- Visit production URL
- Sign in with Google → auto-admin
- Create a room
- Create a booking
- Verify calendar shows it
- Generate invite link
- Test sign-up via invite
- Toggle dark mode

**Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "deploy: production ready"
```

---

## Summary

| Phase | Tasks | Key Deliverables |
|-------|-------|-----------------|
| 1 | 1.1–1.6 | Next.js scaffold, deps, shadcn, vitest, Vercel deploy |
| 2 | 2.1–2.4 | Prisma schema, Neon connection, seed data |
| 3 | 3.1–3.6 | Auth.js, Google OAuth, credentials, middleware, sign-in/up |
| 4 | 4.1–4.4 | Invite links, user management, admin users page |
| 5 | 5.1–5.2 | Room CRUD, blocked ranges, admin rooms page |
| 6 | 6.1–6.3 | Booking engine, conflict prevention, recurring bookings |
| 7 | 7.1–7.5 | Weekly calendar, room tabs, booking dialog, main page |
| 8 | 8.1–8.3 | Admin layout, settings, bookings management |
| 9 | 9.1 | Booking history page |
| 10 | 10.1–10.4 | Dark mode, loading/error states, a11y, production deploy |

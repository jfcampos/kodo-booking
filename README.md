# Kodo Booking

A lightweight web app for managing reservations of shared rehearsal rooms. Designed for small groups (<20 users) with a weekly calendar view, conflict prevention, and role-based access.

---

## Features

### 📅 Calendar
- **Weekly & monthly views** with room tabs
- Configurable time-slot granularity (default 30 min)
- Color-coded bookings per user
- Click-to-book on any empty slot

### 🎵 Bookings
- Flexible start/end times with conflict prevention
- Title & notes per booking
- Recurring bookings (admin-only, weekly)
- Booking history (own for members, all for admins)
- Configurable limits: max advance window, max active bookings, max duration

### 👥 Users & Auth
- **Google OAuth** + email/password login
- Three roles: **Admin**, **Member**, **Viewer**
- Invite-only registration via role-specific links
- First user auto-becomes admin
- Per-user booking color (auto-assigned, customizable)

### 🛠 Admin Panel
- User management (invite, role change, remove, impersonate)
- Room management (create, edit, disable, block time ranges)
- Booking management (view all, cancel any, recurring series)
- System settings (granularity, limits, duration)

### 🎨 UI/UX
- Mobile-first responsive design
- Dark mode (system preference + toggle)
- Internationalization (next-intl)
- shadcn/ui components

---

## Tech Stack

| Tech | Version |
|------|---------|
| Next.js (App Router) | 16.1 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| shadcn/ui | New York style, Zinc |
| Auth.js (NextAuth) | 5 beta |
| Prisma | 6.19 |
| PostgreSQL | 15+ |
| Zod | 4 |
| Vitest | 4 |

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 10+
- **Docker** (for local Postgres) or a remote PostgreSQL instance

### Setup

```bash
# Clone
git clone https://github.com/jfcampos/kodo-booking.git
cd kodo-booking

# Install dependencies
pnpm install

# Copy env file and fill in values
cp .env.example .env
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth JWT secret |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `ROOT_USER_EMAIL` | Seeded admin email |
| `ROOT_USER_PASSWORD` | Seeded admin password |
| `ROOT_USER_NAME` | Seeded admin name |

### Database

```bash
# Start local Postgres with Docker
docker run -d --name kodobooking-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=kodobooking \
  -p 5432:5432 postgres:15

# Run migrations
pnpm prisma migrate dev

# Seed admin user
pnpm prisma db seed
```

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Protected routes
│   │   ├── admin/          # Admin pages (users, rooms, bookings, settings)
│   │   ├── history/        # Booking history
│   │   └── settings/       # User settings
│   └── (auth)/             # Sign-in, sign-up
├── components/
│   ├── calendar/           # Weekly/monthly calendar, booking dialog
│   ├── admin/              # Admin tables & forms
│   ├── layout/             # Header, theme, nav
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── actions/            # Server actions (bookings, rooms, users, auth)
│   ├── validations/        # Zod schemas
│   ├── auth.ts             # NextAuth config
│   └── prisma.ts           # Prisma singleton
└── middleware.ts            # Route protection
```

---

## Deployment

Deploy to **Vercel**:

1. Connect your GitHub repo
2. Set the environment variables listed above
3. Build command is already configured: `prisma generate && prisma migrate deploy && next build`
4. Deploy

---

## License

MIT

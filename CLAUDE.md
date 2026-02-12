# Kodo Booking — Product Requirements Document

A lightweight web application for managing reservations of shared rehearsal rooms. Designed for a small group of users (under 20), the app provides a weekly calendar view where members can see availability, book time slots, and manage their reservations while preventing scheduling conflicts.

---

## Tech Stack

- **Framework:** Next.js (App Router, full-stack on Vercel)
- **Language:** TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Authentication:** Auth.js (NextAuth) — Google OAuth + Credentials provider
- **Database:** PostgreSQL (Neon or Vercel Postgres)
- **ORM:** Prisma
- **Validation:** Zod
- **Hosting & Deployment:** Vercel

---

## Users & Authentication

### Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Full control: manage users, rooms, bookings, configure rules, create recurring bookings, block time ranges |
| **Member** | Book rooms, edit own booking title/notes, cancel own bookings, view calendar, view own booking history |
| **Viewer** | View calendar (read-only), see who booked each slot |

### Onboarding

- Admin generates **role-specific invite links** (member or viewer) with **configurable expiration**
- New users register via the invite link and are assigned the role tied to that link
- No open/public registration

### Authentication Methods

- **Google OAuth** (primary)
- **Email + password** (fallback for users who prefer not to use Google)

### Bootstrap

- The **first user to sign up** automatically becomes admin
- Subsequent users must use an invite link

---

## Rooms

- **Multi-room ready** from the start (can launch with a single room)
- Rooms are available **24/7** (no operating-hour restrictions)
- Admins can **add, edit, and disable** rooms
- Admins can create **blocked time ranges** per room (e.g., maintenance, private events) that prevent anyone from booking

---

## Bookings

### Creating a Booking

- **Flexible start/end times** — users pick start and end times freely
- **Time granularity:** Admin-configurable (default: **30-minute** increments)
- **No minimum or maximum duration** limits
- **Conflict prevention:** The system prevents double-booking on the same room

### Booking Data

| Field | Required | Description |
|-------|----------|-------------|
| Title | Yes | Short label (e.g., "Band practice") |
| Notes | No | Optional description or details |
| Room | Yes | Which room is being booked |
| Start time | Yes | Booking start (aligned to granularity) |
| End time | Yes | Booking end (aligned to granularity) |
| Booked by | Auto | The user who created the booking |

### Editing a Booking

- Members can **edit the title and notes** of their own future bookings
- Members **cannot change the time** — they must cancel and create a new booking
- Admins can edit or cancel **any** booking

### Cancellation

- Users can cancel their own bookings **anytime before the slot starts**
- No cancellation penalties or notice requirements

### Recurring Bookings

- **Only admins** can create recurring bookings (e.g., every Tuesday 7-9pm)
- Recurring bookings are subject to the same conflict-prevention rules

### Booking Limits (Admin-Configurable)

| Setting | Description |
|---------|-------------|
| **Max advance window** | How far in the future users can book (e.g., 2 weeks) |
| **Max active bookings** | Maximum number of future bookings per user (e.g., 3) |

---

## Calendar & UI

### Views

- **Weekly calendar view** — the primary and only view
- Shows 7 days with time-slot rows
- **Room selector/tabs** to switch between rooms (one room visible at a time)

### Booking Visibility

- **Everyone** (including viewers) can see **who booked** each slot

### Design

- **Mobile-first** design, responsive on desktop
- **Dark mode** with toggle (respects system preference by default)

---

## Admin Panel

### User Management

- Generate **role-specific invite links** (member or viewer) with configurable expiration
- **Remove** users
- **Change user roles** (admin/member/viewer)

### Room Management

- **Add** new rooms
- **Edit** room details (name, description, etc.)
- **Disable** rooms (hides from booking, preserves history)
- Create **blocked time ranges** per room

### Booking Management

- **Edit or cancel any booking** (override)
- Create **recurring bookings**

### Settings

- Configure **time-slot granularity** (default: 30 min)
- Configure **max advance booking window**
- Configure **max active bookings per user**

---

## Booking History

- **Users** can view their own past bookings
- **Admins** can view all past bookings

---

## Notifications

- **No email notifications** — users check the app directly

---

## Non-Functional Requirements

- **Security:** Secure auth, role-based access enforcement on both client and server
- **Performance:** Fast load times for small user base (<20 users)
- **Accessibility:** Basic accessibility (semantic HTML, keyboard navigation)
- **Data integrity:** Conflict prevention enforced at database level (not just UI)

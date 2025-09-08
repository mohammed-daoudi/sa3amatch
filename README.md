# Sa3aMatch – Football Field Booking Platform

Sa3aMatch is a **modern, professional web platform** dedicated to booking football fields in Khouribga. It allows users to easily reserve a field by the hour, check availability, view weather forecasts, and manage favorite fields. Field owners can manage reservations through a secure admin dashboard.

---

## ✨ Features

### 🔓 User Side

- Secure account creation and login with **Clerk**
- Interactive map with **Leaflet.js + OpenStreetMap**
- Real-time availability grid (past or booked slots disabled)
- Direct booking with flexible payments (cash, bank transfer proof, optional Stripe)
- Email confirmations & reminders via **Resend**
- Favorites management for quick access
- Detailed field profiles (price, availability, photos, reviews)
- Upload documents (ID, license, proof)
- Upcoming matches & booking history
- Weather forecast for the booked time slot (via OpenWeatherMap)
- GPS directions to the field
- Profile management: update email, phone, password, picture
- GDPR consent & terms acceptance

### ⭐ Advanced User Features

- Smart availability grid with automatic updates
- Advanced filters (location, price, rating, lighting, etc.)
- Ratings & reviews system for fields
- Invoice & receipt generation after booking
- Partial deposit (acompte) support

### 🛠 Admin Side

- Secure admin access with role-based authorization
- Dashboard for managing:
    - Fields
    - Reservations
    - Time slots
    - Users
    - Payouts & statistics
- Reservation approval/rejection lifecycle
- Analytics (revenue, utilization, popular hours)

---

## 🧱 Tech Stack

- **Framework**: Next.js (App Router, Server Actions, Route Handlers)
- **Runtime**: Bun (package manager & JavaScript runtime)
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Database**: MongoDB Atlas (Mongoose)
- **Authentication**: Clerk
- **State/Data**: TanStack Query + Server Actions
- **Forms & Validation**: React Hook Form + Zod
- **Maps**: Leaflet + OpenStreetMap
- **Weather**: OpenWeatherMap API
- **Charts**: Recharts
- **Payments**: Cash, bank transfer, optional Stripe
- **Email**: Clerk (auth) + Resend (transactional)
- **Testing**: Vitest + React Testing Library + Playwright
- **CI/CD**: GitHub Actions → Vercel
- **Logging**: Vercel Analytics + Pino

---

## 📁 Project Structure

```
/ (Next.js App Router)
  app/
    (marketing)/page.tsx
    (dashboard)/layout.tsx page.tsx
    bookings/page.tsx
    favorites/page.tsx
    fields/page.tsx
    fields/[id]/page.tsx
    admin/
      layout.tsx
      page.tsx
      fields/page.tsx
      bookings/page.tsx
      users/page.tsx
  api/
    fields/route.ts
    fields/[id]/route.ts
    bookings/route.ts
    bookings/[id]/route.ts
    favorites/route.ts
    uploads/route.ts
    stripe/webhook/route.ts
    notifications/route.ts
  components/
  lib/        # db, auth, validation, utils
  server/     # server actions
  scripts/seed.ts
  public/
  .github/workflows/

```

---

## 🗄 Database Schema (MongoDB)

- **Users**: Clerk userId, favorites, role, phone
- **Fields**: name, location, price, photos, availability
- **Bookings**: fieldId, userId, slot, status, payment method, proof
- **TimeSlots**: ensure no double-booking
- **Audit Logs**: admin actions

---

## 🔐 Authentication & Authorization

- **Clerk** handles signup, login, MFA, social logins
- Roles: `user` (default) and `admin`
- Admin routes (`/admin/*`) require `admin` role
- API routes validated with Clerk’s SDK

---

## 📧 Email Notifications

- **Clerk** → auth emails (verification, reset, login)
- **Resend** → booking lifecycle:
    - Booking created (pending)
    - Approved / Rejected
    - Canceled
    - Reminder (24h before)

---

## 🧠 Booking Rules

- Atomic transactions for concurrency safety
- No double-booking enforced with `timeSlots`
- Lifecycle: pending → approved/rejected → canceled

---

## 📊 Admin Analytics

- Revenue & payouts
- Field utilization %
- Popular hours
- Built with MongoDB aggregation + Recharts

---

## 🧪 Testing Strategy

- Unit tests: booking logic, validation
- Integration tests: API routes with Clerk & Mongo mocked
- E2E tests: booking flows, proof uploads, emails (mocked)

---

## ⚙️ Development

```bash
# Install dependencies
bun install

# Run dev server
bun run dev

# Run tests
bun test

# Lint code
bun run lint

# Format code
bun run format

# Build for production
bun run build

# Start production server
bun run start
```

## 📦 Dependencies

### Production Dependencies
```bash
# Core Framework & React
bun add next@^15.3.2 react@^18.3.1 react-dom@^18.3.1

# Authentication & Authorization
bun add @clerk/nextjs@^6.31.9

# Database & ORM
bun add mongoose@^8.18.0

# UI Components & Styling
bun add @radix-ui/react-checkbox@^1.3.3 @radix-ui/react-dialog@^1.1.15
bun add @radix-ui/react-label@^2.1.7 @radix-ui/react-select@^2.2.6
bun add @radix-ui/react-slot@^1.2.3 class-variance-authority@^0.7.1
bun add clsx@^2.1.1 tailwind-merge@^3.3.0 tailwindcss-animate@^1.0.7
bun add lucide-react@^0.475.0 next-themes@^0.4.6 sonner@^2.0.7

# State Management & Data Fetching
bun add @tanstack/react-query@^5.87.1 @tanstack/react-query-devtools@^5.87.1

# Forms & Validation
bun add react-hook-form@^7.62.0 @hookform/resolvers@^5.2.1 zod@^4.1.5

# Maps & Location
bun add leaflet@^1.9.4 react-leaflet@^5.0.0 @types/leaflet@^1.9.20

# Charts & Analytics
bun add recharts@^3.1.2

# Email & Communication
bun add resend@^6.0.2

# Utilities
bun add date-fns@^4.1.0 same-runtime@^0.0.1
```

### Development Dependencies
```bash
# TypeScript & Types
bun add -d typescript@^5.8.3 @types/node@^20.17.50
bun add -d @types/react@^18.3.22 @types/react-dom@^18.3.7

# Linting & Formatting
bun add -d eslint@^9.27.0 eslint-config-next@15.1.7 @eslint/eslintrc@^3.3.1
bun add -d @biomejs/biome@1.9.4

# Styling
bun add -d tailwindcss@^3.4.17 postcss@^8.5.3
```

---

## 🔑 Environment Variables

```
MONGODB_URI=mongodb+srv://fermed:UPvF4DYqzKpL97P4@cluster0.fm0nuyw.mongodb.net/sa3amatch
MONGODB_DB=sa3amatch
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bWVldC1zdGluZ3JheS0zOS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_QnsjZvy1ugB6RfydmfTQicl2g4aYztUVJ3zSKevQzg
RESEND_API_KEY=re_RtvfprJv_Ld5ACcD1x8mmir2G8uXuZkMU
NEXT_PUBLIC_MAP_TILES_URL=...
STRIPE_SECRET_KEY=...           # optional
STRIPE_WEBHOOK_SECRET=...       # optional
NEXT_PUBLIC_SITE_URL=...

---

## 🚀 Deployment

* **Frontend & API** → Vercel
* **Database** → MongoDB Atlas
* **CI/CD** → GitHub Actions

---

## ✅ Acceptance Criteria

* Users can browse, book, and favorite fields
* No double-booking possible
* Booking lifecycle enforced
* Resend delivers booking emails
* Admins manage fields, bookings, analytics
* Mobile-first & i18n-ready (English → Arabic/French)
* Fully secure & production-deployed

---

## 📜 License

MIT © Sa3aMatch

```

# ⚽ Sa3aMatch – Football Field Booking Platform

Sa3aMatch is a **full-stack football field booking platform** built for Khouribga.  
It enables users to discover fields, check availability, and book hourly slots.  
Admins can manage fields, bookings, and view analytics.  

Built with **Next.js (App Router), MongoDB, Clerk, and Resend** for a secure and scalable experience.

---

## ✨ Features

- 🏟 Discover football fields with details and availability
- 📅 Book hourly slots (cash, bank transfer with proof, or Stripe card payments)
- 🔄 Booking lifecycle: **pending → approved/rejected → canceled**
- ❤️ Favorite fields for quick access
- 👤 Authentication & profile management with **Clerk**
- 👨‍💼 Admin dashboard for fields, bookings, payouts, and analytics
- 📊 Revenue & utilization insights with charts
- 📧 Transactional booking notifications via **Resend**
- 🌍 Mobile-first & **i18n-ready** (English → Arabic/French next)
- 🔒 Secure & production-ready with strict validation and access control

---

## 🧱 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions, Route Handlers)  
- **Language**: TypeScript  
- **UI**: Tailwind CSS + shadcn/ui + Radix UI  
- **Data**: TanStack Query (client) + Server Actions  
- **Forms & Validation**: React Hook Form + Zod  
- **Auth**: Clerk  
- **Database**: MongoDB Atlas (Mongoose)  
- **Maps**: Leaflet + OpenStreetMap tiles  
- **Charts**: Recharts  
- **Payments**: Cash, bank transfer proof, optional Stripe  
- **Email**: Clerk (auth) + Resend (transactional)  
- **Testing**: Vitest + React Testing Library + Playwright  
- **CI/CD**: GitHub Actions → Vercel  
- **Logging**: Vercel Analytics + Pino  

---

## 📁 Project Structure

/ (Next.js App Router)
app/
(marketing)/page.tsx
(dashboard)/
layout.tsx
page.tsx
bookings/page.tsx
favorites/page.tsx
fields/
page.tsx
[id]/page.tsx
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
lib/ # db, auth, validation, utils
server/ # server actions
scripts/seed.ts
public/
.github/workflows/


## 🗄 Database (MongoDB)

Connection string (Atlas):  

```env
MONGODB_URI=mongodb+srv://fermed:UPvF4DYqzKpL97P4@cluster0.fm0nuyw.mongodb.net/sa3amatch
MONGODB_DB=sa3amatch
Schemas include:

Users: Clerk userId, favorites, role, phone

Fields: name, location, price, photos, availability

Bookings: fieldId, userId, time slot, status, payment method, proof

TimeSlots: enforce no double-booking

Audit Logs: admin actions

🔐 Authentication & Authorization
Clerk → handles sign-up, sign-in, profile, MFA, and social logins.

Roles:

user (default)

admin (set via Clerk Dashboard/publicMetadata).

Middleware: /admin/* routes require admin role.

API routes validated with Clerk’s server-side SDK.

📧 Email Notifications
Clerk → auth flows (verification, reset, login links).

Resend → booking emails:

Booking created (pending)

Booking approved/rejected

Booking canceled

Reminder (24h before)

🧠 Booking Rules
Atomic transactions to prevent double bookings.

timeSlots collection ensures concurrency safety.

📊 Admin Analytics
Revenue

Utilization %

Popular hours

Built using MongoDB aggregation pipelines + Recharts.

🧪 Testing Strategy
✅ Unit tests → booking logic, validation

✅ Integration tests → API routes with mocked Clerk/Mongo

✅ E2E tests → booking flow, proof uploads, emails (mocked Resend)

⚙️ Development
Install dependencies

pnpm install
Run dev server

pnpm dev
Run tests

pnpm test
🔑 Environment Variables
env
MONGODB_URI=mongodb+srv://fermed:UPvF4DYqzKpL97P4@cluster0.fm0nuyw.mongodb.net/sa3amatch
MONGODB_DB=sa3amatch
CLERK_SECRET_KEY=your_clerk_secret
CLERK_PUBLISHABLE_KEY=your_clerk_key
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_MAP_TILES_URL=your_tiles_url
STRIPE_SECRET_KEY=optional_stripe_key
STRIPE_WEBHOOK_SECRET=optional_webhook_secret
NEXT_PUBLIC_SITE_URL=https://sa3amatch.vercel.app
🚀 Deployment
Frontend + API → Vercel

Database → MongoDB Atlas

CI/CD → GitHub Actions

✅ Acceptance Criteria
Users can browse, book, and favorite fields.

No double-booking possible.

Booking statuses enforced.

Resend delivers booking emails.

Admin can manage fields, bookings, analytics.

Fully secure, i18n-ready, production-deployed.

📜 License
MIT © Sa3aMatch




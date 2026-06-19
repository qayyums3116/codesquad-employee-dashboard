# CodeSquad Dashboard — Setup Guide

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **Anon Key** (Project Settings → API)

### 2. Run the Database Schema

In the Supabase **SQL Editor**, paste and run `supabase/schema.sql`.

### 3. Create the Admin User

In Supabase → **Authentication → Users → Add User**:
- Email: `admin@codesquad.ai`
- Password: `codesquad@1234`

Then in SQL Editor, run:
```sql
UPDATE profiles
SET role = 'admin', full_name = 'Admin User', department = 'Management', position = 'System Administrator'
WHERE email = 'admin@codesquad.ai';
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Supabase values:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 5. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploying to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

---

## Creating Employee Accounts

### Option A: Admin UI
Log in as admin → Employees → Add Employee

### Option B: Supabase Auth API
Create users via Supabase Auth dashboard. They will be auto-assigned `employee` role.

---

## Credentials

| Role     | Email                   | Password        |
|----------|-------------------------|-----------------|
| Admin    | admin@codesquad.ai      | codesquad@1234  |
| Employee | (created by admin)      | (set by admin)  |

---

## Project Structure

```
codesquad-dashboard/
├── app/
│   ├── auth/login/          # Login page
│   ├── employee/
│   │   ├── dashboard/       # Employee dashboard
│   │   ├── tasks/           # Task submission + history
│   │   └── feedback/        # View feedback
│   ├── admin/
│   │   ├── dashboard/       # Admin overview
│   │   ├── employees/       # Employee CRUD
│   │   ├── tasks/           # All tasks view
│   │   ├── feedback/        # Submit/manage feedback
│   │   └── reports/         # Analytics
│   └── settings/            # Account settings
├── components/
│   ├── layout/              # Sidebar, Navbar, UserMenu
│   ├── dashboard/           # Charts, StatCards
│   ├── tasks/               # Task forms & tables
│   ├── admin/               # Admin-specific components
│   ├── notifications/       # Notification bell
│   └── settings/            # Settings form
├── lib/
│   ├── supabase/            # Client, Server, Middleware
│   └── utils.ts             # Helpers
├── types/
│   └── database.ts          # TypeScript types
└── supabase/
    ├── schema.sql           # Full DB schema + RLS
    └── seed.sql             # Sample data reference
```

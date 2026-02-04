# QBody Web Platform

Professional fitness platform with courses, programs, and personal coaching.
Multilingual support: English & Russian.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **Landing Page** - Hero, Programs, Courses, About, Results, Footer
- **Client Portal** - Dashboard, Courses, Progress, Profile
- **Admin Dashboard** - Full management: Clients, Exercises, Workouts, Programs, Check-ins, Messages, Nutrition, Payments, Analytics, Settings
- **Multilingual** - English/Russian with language switcher
- **Course Pages** - Public course pages with purchase flow

## Pages

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/courses/[slug]` | Course details |
| `/auth/login` | Login |
| `/auth/register` | Register |
| `/client/home` | Client dashboard |
| `/client/courses` | My courses |
| `/client/courses/[id]` | Course view |
| `/client/progress` | Progress tracking |
| `/client/profile` | Profile settings |
| `/dashboard` | Admin dashboard |
| `/dashboard/clients` | Manage clients |
| `/dashboard/exercises` | Exercise library |
| `/dashboard/workouts` | Workout templates |
| `/dashboard/programs` | Training programs |
| `/dashboard/checkins` | Check-ins review |
| `/dashboard/messages` | Client chat |
| `/dashboard/nutrition` | Nutrition plans |
| `/dashboard/payments` | Payment management |
| `/dashboard/analytics` | Business analytics |
| `/dashboard/settings` | Site settings + Translations |

## Translation System

1. All translations are in `/src/lib/i18n.tsx`
2. Use `const { t, locale } = useTranslation()` in components
3. Call `t('key.path')` to get translated text
4. Add new translations in settings: Dashboard → Settings → Translations

## Adding New Language

1. Add locale code to `type Locale = 'en' | 'ru' | 'es'`
2. Add translations object in `translations` constant
3. Add option in `LanguageSwitcher` component

## Database Setup (Supabase)

1. Create project at [supabase.com](https://supabase.com)
2. Run `/supabase/schema.sql` in SQL Editor
3. Copy keys to `.env.local`

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pub_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth, Database, Storage)
- Stripe (Payments)
- Lucide Icons
- Sonner (Toasts)

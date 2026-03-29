# OpsPulse AI

**Real-Time Operations Control Tower for Throughput, Backlog, SLA Risk, and Staffing Decisions**

OpsPulse AI is a production-ready operations intelligence platform built for warehouses, fulfilment centres, and last-mile logistics hubs. It gives operations managers and analysts a live view of throughput, backlog, SLA performance, staffing gaps, and operational risk — with AI-powered recommendations and scenario simulation.

---

## 📸 Screenshots

> _Deploy the app and add screenshots here_

| Dashboard | Shift Monitoring | Bottleneck Analysis |
|-----------|-----------------|---------------------|
| ![Dashboard](./public/screenshots/dashboard.png) | ![Shifts](./public/screenshots/shifts.png) | ![Bottlenecks](./public/screenshots/bottlenecks.png) |

| Alerts Feed | Recommendations | Scenario Simulator |
|-------------|-----------------|-------------------|
| ![Alerts](./public/screenshots/alerts.png) | ![Recommendations](./public/screenshots/recommendations.png) | ![Simulator](./public/screenshots/simulator.png) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js 14 App                        │
│                      (App Router + RSC)                      │
├──────────────┬──────────────────────────┬───────────────────┤
│   Frontend   │      API Route Handlers  │   Analytics Engine │
│  (React/TSX) │   /api/metrics           │   risk-engine.ts   │
│  Recharts    │   /api/alerts            │   simulator.ts     │
│  shadcn/ui   │   /api/recommendations   │   data-generator   │
│  Tailwind    │   /api/simulate          │                    │
├──────────────┴──────────────────────────┴───────────────────┤
│                     Data Layer                               │
│   Supabase (PostgreSQL) ←→ Supabase JS Client               │
│   Mock Data Fallback (no DB required for demo)              │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Mock-first**: `NEXT_PUBLIC_USE_MOCK_DATA=true` runs the full app with synthetic data — no database required
- **Serverless-friendly**: All API routes are Next.js Route Handlers (no always-on server)
- **Rule-based analytics**: Transparent, explainable risk scoring (no black-box ML)
- **Real-time feel**: 15-second polling with animated updates
- **Vercel-ready**: Zero config deployment

---

## ✨ Features

### A. Executive Dashboard
- 10 live KPI cards: Incoming Orders, Processed Orders, Backlog, Throughput/hr, SLA%, Active Staff, Required Staff, Staffing Gap, Absenteeism%, Delay Risk Score
- 6 trend charts: Throughput, Backlog, SLA, Staffing, Site Comparison, Process Stage Comparison
- Auto-refreshes every 15 seconds

### B. Shift Monitoring
- Per-shift cards for all 6 shifts (2 sites × 3 shifts)
- Risk badges: Low / Medium / High / Critical
- Predicted end-of-shift backlog
- Staffing gap and absenteeism indicators

### C. Bottleneck Analysis
- Identifies worst-performing process stages (Inbound → Picking → Packing → Dispatch)
- Shows cycle time spikes, throughput shortfall, backlog build-up, exception count
- Likely cause, SLA impact, and suggested action per bottleneck

### D. Alerts Feed
- Live feed of operational alerts with severity badges
- Alert types: Backlog Spike, SLA Risk, Absenteeism, Throughput Below Target, Stage Bottleneck, High Risk Score
- Filter by site, shift, severity, and status

### E. Recommendations Engine
- AI-generated action recommendations
- Categories: Staffing, Throughput, Escalation, Process, SLA
- Business reason, expected impact, and priority per recommendation

### F. Scenario Simulator
- Sliders for: Demand Increase, Absenteeism Increase, Throughput Change, Staffing Change, Process Delay
- Quick presets: Peak Demand Surge, High Absenteeism, Process Breakdown, Staffing Boost, Black Friday
- Outputs: Projected Backlog, Projected SLA, Risk Score, Recommended Staffing, Expected Bottleneck

---

## 🧠 Analytics & Risk Scoring

The risk engine uses a **weighted 5-component model** (0–100 scale):

| Component | Weight | Trigger |
|-----------|--------|---------|
| Backlog Growth | 25 pts | Rising backlog over consecutive intervals |
| Staffing Gap | 25 pts | Active staff below required headcount |
| Throughput Shortfall | 20 pts | Throughput below target threshold |
| Absenteeism | 15 pts | Absenteeism rate above safe threshold |
| SLA Degradation | 15 pts | SLA attainment below 90% |

**Risk Levels:**
- 🟢 **Low** (0–24): Normal operations
- 🟡 **Medium** (25–49): Monitor closely
- 🟠 **High** (50–74): Intervention required
- 🔴 **Critical** (75–100): Escalate immediately

---

## 🗄️ Database Schema

```sql
sites           -- 2 sites (Northgate Manchester, Southpark Birmingham)
shifts          -- 6 shifts (3 per site: Morning/Afternoon/Night)
ops_metrics     -- Hourly operational snapshots per shift
process_metrics -- Per-stage metrics (Inbound/Picking/Packing/Dispatch)
alerts          -- Generated operational alerts
recommendations -- AI-generated action recommendations
```

See `supabase/migrations/001_initial_schema.sql` for full schema.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone and install

```bash
git clone https://github.com/your-username/opspulse-ai.git
cd opspulse-ai
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# For mock data mode (no database needed):
NEXT_PUBLIC_USE_MOCK_DATA=true

# For Supabase mode:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. (Optional) Seed database

If using Supabase:

```bash
# Apply schema first (via Supabase dashboard or CLI)
# Then seed:
npm run seed
```

---

## 🗃️ Supabase Setup

### Option A: SQL Editor (Recommended)

1. Go to [app.supabase.com](https://app.supabase.com) → your project → SQL Editor
2. Run `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/seed.sql`

### Option B: Supabase CLI

```bash
npx supabase db push
npm run seed
```

### Option C: Mock Data (No Database)

Set `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local` — the app runs entirely on synthetic data.

---

## ☁️ Deployment on Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: OpsPulse AI"
git remote add origin https://github.com/your-username/opspulse-ai.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy**

### Step 3: Set Environment Variables

In Vercel dashboard → Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `NEXT_PUBLIC_USE_MOCK_DATA` | `false` (or `true` for demo) |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_REFRESH_INTERVAL` | `15000` |

### Step 4: Redeploy

After setting environment variables, trigger a redeploy.

---

## ✅ Deployment Checklist

- [ ] `npm run build` passes locally
- [ ] All environment variables set in Vercel
- [ ] Supabase project created and schema applied
- [ ] Supabase RLS policies configured (or disabled for demo)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- [ ] `NEXT_PUBLIC_USE_MOCK_DATA=false` for production with real DB
- [ ] Custom domain configured (optional)

---

## 🔧 Troubleshooting

### Build fails on Vercel

```
Error: Cannot find module '@/components/...'
```
→ Check `tsconfig.json` paths alias is `"@/*": ["./*"]`

### Supabase connection fails

```
Error: Invalid API key
```
→ Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables

### App shows no data

→ Check `NEXT_PUBLIC_USE_MOCK_DATA=true` is set, or verify Supabase tables exist

### Charts not rendering

→ Recharts requires client-side rendering. Ensure chart components have `"use client"` directive.

### Hydration errors

→ Ensure server and client render the same initial state. Mock data generator uses deterministic seeds where possible.

---

## 📁 Project Structure

```
opspulse-ai/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with sidebar
│   ├── page.tsx                  # Redirect to /dashboard
│   ├── globals.css               # Global styles + CSS variables
│   ├── dashboard/page.tsx        # Executive Dashboard
│   ├── shifts/page.tsx           # Shift Monitoring
│   ├── bottlenecks/page.tsx      # Bottleneck Analysis
│   ├── alerts/page.tsx           # Alerts Feed
│   ├── recommendations/page.tsx  # Recommendations Engine
│   ├── simulator/page.tsx        # Scenario Simulator
│   └── api/
│       ├── metrics/route.ts      # GET /api/metrics
│       ├── alerts/route.ts       # GET /api/alerts
│       ├── recommendations/route.ts # GET /api/recommendations
│       └── simulate/route.ts     # POST /api/simulate
├── components/
│   ├── layout/                   # Sidebar, TopBar, AppShell
│   ├── ui/                       # shadcn/ui components
│   ├── dashboard/                # KPI cards, charts
│   ├── shifts/                   # Shift cards
│   ├── bottlenecks/              # Bottleneck cards
│   ├── alerts/                   # Alert cards
│   ├── recommendations/          # Recommendation cards
│   └── simulator/                # Simulator results panel
├── lib/
│   ├── utils.ts                  # Utility functions
│   ├── data-generator.ts         # Synthetic data engine
│   ├── risk-engine.ts            # Risk scoring & bottleneck detection
│   ├── simulator.ts              # Scenario simulation logic
│   └── supabase.ts               # Supabase client
├── hooks/
│   ├── useMetrics.ts             # Metrics data hook with polling
│   └── useAlerts.ts              # Alerts data hook with polling
├── types/
│   └── index.ts                  # All TypeScript types
├── supabase/
│   ├── migrations/001_initial_schema.sql
│   └── seed.sql
├── scripts/
│   └── seed.ts                   # Database seed script
├── .env.example                  # Environment variable template
└── README.md
```

---

## 🔮 Future Improvements

- [ ] **Real-time WebSockets** via Supabase Realtime for true push updates
- [ ] **Authentication** with Supabase Auth (role-based: Manager / Analyst / Viewer)
- [ ] **Historical reporting** with date range picker and export to CSV/PDF
- [ ] **ML-powered forecasting** using time-series models (Prophet / ARIMA)
- [ ] **Mobile app** with React Native + Expo
- [ ] **Slack/Teams integration** for alert notifications
- [ ] **Multi-tenant** support for multiple logistics clients
- [ ] **Custom KPI thresholds** configurable per site
- [ ] **Shift handover reports** auto-generated at shift end
- [ ] **API webhooks** for integration with WMS/TMS systems

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui + Radix UI |
| Charts | Recharts |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| Auth-ready | Supabase Auth |
| Validation | Zod |
| Forms | React Hook Form |
| Deployment | Vercel |

---

## 📄 License

MIT — free to use for portfolio, commercial, and educational purposes.

---

_Built as a professional portfolio project demonstrating operations intelligence, full-stack engineering, and data analytics capabilities._

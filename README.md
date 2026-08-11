# MigraineGuardian — Calm Digital Health Frontend Foundation

MigraineGuardian is a serene, clinical-grade companion platform for predictive migraine wellness and autonomic nervous system care.

## Design System Tokens
- **Background (Canvas)**: `#F7F6F2`
- **Primary Dark Green**: `#26352F`
- **Sage**: `#A8B9A5`
- **Muted Teal**: `#6F9990`
- **Warm Card Surface**: `#EFEEE8`
- **Secondary Text**: `#737873`
- **Muted Alert**: `#C98278`
- **Typography**: DM Sans (Google Fonts)

## Tech Stack
- React 18
- Vite 6
- React Router v6
- Tailwind CSS v3
- Lucide React (Iconography)
- Recharts (Data Visualizations)
- Framer Motion (Subtle ambient transitions)

## Directory Structure
```
src/
├── assets/         # Static imagery, icons, SVG assets
├── components/
│   ├── ui/         # Reusable design tokens (Button, Card, Input, Badge, PageHeader, StatCard, etc.)
│   └── common/     # Global shells (Navbar, Footer, Sidebar, MobileNav, AppTopbar, ScrollToTop, Logo)
├── layouts/        # Layout wrappers (PublicLayout, AuthLayout, AppLayout)
├── pages/          # All 15 routed placeholder & sanctuary pages
├── data/           # Mock data contracts & schemas
├── services/       # Mock service client layer
├── hooks/          # Responsive & storage hooks (useMediaQuery, useLocalStorage)
├── utils/          # Class merge helper, formatters, and route constants
├── App.jsx         # Central router definition
├── main.jsx        # Entry point
└── index.css       # Design tokens and base styles
```

## Available Routes
- `/` — Public Overview & Hero
- `/how-it-works` — Platform methodology & PSS clinical framework
- `/login` — Reassuring user login
- `/signup` — Account registration
- `/onboarding` — 3-step personal trigger & frequency baseline setup
- `/pss-assessment` — Perceived Stress Scale (PSS-10) clinical evaluation
- `/dashboard` — Central sanctuary overview, 5-day foresight & metrics
- `/daily-checkin` — 60-second micro-log (sleep, hydration, sensory strain)
- `/risk-analysis` — Atmospheric pressure & trigger modeling
- `/insights` — Empirical lifestyle correlations
- `/analytics` — Longitudinal Recharts trends & episode tracking
- `/reports` — Doctor-ready neurological summaries & export
- `/chat` — Guardian AI wellness assistant
- `/profile` — Patient profile & Acute Emergency Relief Protocol
- `/settings` — Sensory ergonomics, quiet hours, and local privacy

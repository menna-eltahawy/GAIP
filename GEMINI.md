# GEMINI.md

## 1. Context & Status
- **Goal:** Migrate the Web-GIS agricultural project into a brand-new, ultra-modern, and highly professional React layout.
- **Current Status:** All code generated, integrated with Vitest tests, styled with Recharts area plots, and optimized for API caching/caching tab switches. Enhanced with global typography overhaul, massive hero cards, and a multi-plot comparison suite.
- **Next Steps:** None. Ready for user feedback.

## 2. Technical Decisions (ADRs)
- **Stack:** React (Vite), Tailwind CSS, Leaflet, Axios, Lucide React
- **Why:** Reusing the existing stack from the previous frontend, but upgrading the design to an enterprise-grade tactical command console layout with Emerald-950 and Deep Slate-900 colors.
- **Design System:** Sleek Glassmorphism (`backdrop-blur-md`, `bg-slate-900/80` or `bg-white/80` boxes, thin borders). Sans-serif font for context, Monospace font for geographic coordinates and coordinates.

## 3. Development Commands
- **Build:** `npm run build`
- **Test:** `npm run lint`
- **Run Locally:** `npm run dev`

## 4. Architecture Overview
- **Entry Point:** `src/main.jsx` -> `src/App.jsx` (or `src/App.tsx`)
- **Key Files & Directories:**
  - `src/components/`: Modular presentation and interactive maps/forms
  - `src/pages/`: Page containers (Login, Signup, DecisionMaker, FieldEngineer)
  - `src/IoTSimulator.jsx`: Integrated IoT dashboard and device simulation controls

## 5. Role & Style
- **Persona:** Senior UI/UX Frontend Svelte Developer / React Expert, prioritizing high-quality aesthetics, precise animations, and modern React 19 best practices.
- **Priorities:** Modern Glassmorphism styling, clean responsiveness, automatic parallel API triggers (classification + 3-year historical compare in parallel), and interactive Leaflet map overlays with custom opacity controls.

# TradePilot AI

**Practice the Market. Master the Process.**

TradePilot AI is an AI-powered practical trading education, historical chart replay, risk management, and behavioural discipline simulation platform.

## Core Learning Loop
`LEARN → ANALYZE → DECIDE → SIMULATE → REVIEW → CORRECT → REPEAT`

## Architecture & Key Modules
- **Brand Configuration**: Centralized in `src/config/brand.ts` so the brand name, tagline, supported markets (`BTC/USD`, `XAU/USD`), and timeframes can be updated in one place.
- **Chart & Drawing Engine (`src/components/TradingChart.tsx`)**: Powered by TradingView Lightweight Charts v5 with Candlestick, Line, and Area modes, Volume histograms, Overlay & Oscillator indicators (`EMA 20`, `EMA 50`, `SMA 200`, `Bollinger Bands`, `VWAP`, `RSI 14`, `ATR 14`, `MACD`, `Stochastic`, `ADX`), and an interactive SVG Drawing Overlay (`Trend Line`, `Horizontal/Vertical Levels`, `Support/Resistance Zones`, `Fibonacci Retracement/Extension`, `Long/Short R:R Boxes`, `Annotations`).
- **Historical Replay Engine (`src/components/TradingTerminalView.tsx`)**: Maintains strict separation between visible candles and hidden future candles. Neither the chart nor the AI receives future candles during the decision phase.
- **Server-Side Gemini AI Layer (`server.ts`)**:
  - `POST /api/ai/risk-check` — Low-latency pre-trade risk and thesis audit using `gemini-3.1-flash-lite`.
  - `POST /api/ai/analyze-chart` — Market structure, key support/resistance, and conditional scenarios with invalidation levels (toggleable between `gemini-3.1-flash-lite` and `gemini-3.1-pro-preview` with `ThinkingLevel.HIGH`).
  - `POST /api/ai/review-trade` — Deep 8-part post-trade educational review and "Where Could The Entry Have Been?" confluence zone calculation using `gemini-3.1-pro-preview` (`ThinkingLevel.HIGH`).
  - `POST /api/ai/training-plan` — Adaptive 7-day personalized training plan using `gemini-3.1-pro-preview` (`ThinkingLevel.HIGH`).
- **Firebase & Zero-Trust Firestore Security (`src/lib/firebase.ts`, `firestore.rules`)**:
  - Google Sign-In authentication (`signInWithPopup`).
  - Hardened ABAC rules in `firestore.rules` validated with `@firebase/eslint-plugin-security-rules`.

## Local Setup & Commands
1. Copy `.env.example` to `.env` and configure `GEMINI_API_KEY`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server (Express + Vite on port 3000):
   ```bash
   npm run dev
   ```
4. Type-check and build for production:
   ```bash
   npm run lint
   npm run build
   ```

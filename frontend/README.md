# Solana dApp Frontend

A minimal Solana web dApp built with Next.js, TypeScript, and Tailwind CSS.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - React components
  - `wallet/` - Wallet connection components
  - `ui/` - Reusable UI components
- `lib/` - Utility functions and configurations
- `styles/` - Global styles and Tailwind CSS
- `public/` - Static assets

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Solana Web3.js (to be added)

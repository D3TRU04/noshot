# noshot‼️

Friend prediction market with micro-bets & stablecoin payouts.

> **Note**: This is a frontend-only placeholder implementation. All API integrations are commented out and ready for backend implementation.

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Frontend Placeholders**: UI components ready for backend integration
- **Phone OTP UI**: Complete OTP verification flow (placeholder implementation)
- **Wallet Connection UI**: Wallet button with placeholder functionality
- **Modern UI**: Playful dark theme with cyan/violet accents
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- clsx & tailwind-merge for styling utilities

## Backend Integration Ready

The following integrations are prepared but commented out:
- **Privy Auth**: Wallet & social authentication (commented out)
- **OTP Service**: Phone verification API calls (placeholder)
- **Wagmi & Viem**: Ethereum integration (commented out)

## Project Structure

```
noshot/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with placeholder provider
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles with custom theme
├── components/            # React components
│   ├── PrivyAuth.tsx      # Wallet integration (placeholder)
│   ├── PhoneInput.tsx     # Phone input with OTP UI (placeholder)
│   └── Logo.tsx           # noshot‼️ logo component
├── lib/                   # Utility functions
│   └── utils.ts           # cn() function for class merging
└── public/                # Static assets
    └── favicon.ico        # Site favicon
```
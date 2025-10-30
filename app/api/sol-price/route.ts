import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function fetchFromHelius(apiKey: string): Promise<number | null> {
  const urls = [
    `https://api.helius.xyz/v0/price?ids=solana&vs_currencies=usd&api-key=${apiKey}`,
    `https://api.helius.xyz/v0/market-data?symbols=SOL&api-key=${apiKey}`,
  ];
  for (const url of urls) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) continue;
    const data = await res.json();
    if (data?.solana?.usd && typeof data.solana.usd === 'number') {
      const usd = data.solana.usd;
      return usd > 0 ? 1 / usd : null; // SOL per USD
    }
    if (data?.SOL?.usd && typeof data.SOL.usd === 'number') {
      const usd = data.SOL.usd;
      return usd > 0 ? 1 / usd : null;
    }
    if (Array.isArray(data?.prices)) {
      const entry = data.prices.find((p: any) => (p?.symbol || '').toUpperCase() === 'SOL');
      if (entry?.usd && typeof entry.usd === 'number') {
        return entry.usd > 0 ? 1 / entry.usd : null;
      }
    }
  }
  return null;
}

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing NEXT_PUBLIC_HELIUS_API_KEY' }, { status: 400 });
    }
    const solPerUsd = await fetchFromHelius(apiKey);
    if (!solPerUsd) {
      return NextResponse.json({ error: 'Helius price unavailable' }, { status: 502 });
    }
    return NextResponse.json({ solPerUsd });
  } catch (e) {
    return NextResponse.json({ error: 'Helius fetch failed' }, { status: 502 });
  }
}



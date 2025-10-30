import type { ClassValue } from "clsx";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

// Fetch SOL price in USD via Helius if available; return SOL per USDC (i.e., SOL/USD)
export async function fetchSolPerUsdcFromHelius(): Promise<number | null> {
  try {
    const res = await fetch('/api/sol-price', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const v = data?.solPerUsd;
    return typeof v === 'number' && v > 0 ? v : null;
  } catch {
    return null;
  }
}

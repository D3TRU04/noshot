// Temporary no-op stubs to avoid type/lint errors until Anchor integration is ready.
import { Connection } from '@solana/web3.js';
import { supabase } from './supabaseClient';

export async function placeBetOnChain(_: any) {
  throw new Error('Anchor integration not implemented. Use SOL transfer path.');
}

export async function claimWinningsOnChain(_: any) {
  throw new Error('Anchor integration not implemented.');
}

export async function resolveBetOnChain(_: any) {
  throw new Error('Anchor integration not implemented.');
}

export async function syncBlockchainState(_: string) {
  return;
}

export function calculatePotentialPayout({
  userBet,
  userSideTotal,
  otherSideTotal,
}: {
  userBet: number;
  userSideTotal: number;
  otherSideTotal: number;
}): { stakeBack: number; shareOfLosers: number; totalPayout: number } {
  const stakeBack = userBet;
  const userPercentage = userBet / userSideTotal;
  const shareOfLosers = userPercentage * otherSideTotal;
  const totalPayout = stakeBack + shareOfLosers;
  return { stakeBack, shareOfLosers, totalPayout };
}


import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { supabase } from './supabaseClient';

// TODO: Import the IDL after building the program
// import IDL from '../contracts/target/idl/noshot.json';

const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || '8HL3MB3Gdqcx2nWd6odgqeFjwKKP88X7pHq1xBcFLQ1m';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// This file bridges Supabase and Solana smart contracts

/**
 * Place a bet on-chain and update Supabase
 */
export async function placeBetOnChain({
  groupId,
  walletAddress,
  side,
  amount,
}: {
  groupId: string;
  walletAddress: string;
  side: 'yes' | 'no';
  amount: number;
}) {
  try {
    // 1. Get connection and program
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com');
    const program = await getNoShotProgram();
    
    // 2. Get group from Supabase
    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (!group) throw new Error('Group not found in Supabase');

    // 3. Find or create member account on Solana
    const [memberPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('member'), new PublicKey(group.id).toBuffer(), new PublicKey(walletAddress).toBuffer()],
      program.programId
    );

    // 4. Place bet on Solana blockchain
    const sideEnum = side === 'yes' ? { yes: {} } : { no: {} };
    const tx = await program.methods
      .placeBet(sideEnum, amount)
      .accounts({
        member: memberPDA,
        group: new PublicKey(group.id),
        vaultTokenAccount: /* vault PDA */,
        userTokenAccount: /* user's USDC account */,
        user: new PublicKey(walletAddress),
        tokenProgram: /* token program */,
      })
      .rpc();

    // 5. Update Supabase after successful on-chain bet
    await supabase.from('bets').insert({
      group_id: groupId,
      user_wallet: walletAddress,
      bet_amount: amount,
      side: side,
      solana_tx: tx,
      created_at: new Date().toISOString(),
    });

    return tx;
  } catch (error) {
    console.error('Error placing bet on-chain:', error);
    throw error;
  }
}

/**
 * Claim winnings and update Supabase
 */
export async function claimWinningsOnChain({
  groupId,
  walletAddress,
}: {
  groupId: string;
  walletAddress: string;
}) {
  try {
    // 1. Get connection and program
    const program = await getNoShotProgram();
    
    // 2. Get group from Supabase
    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (!group) throw new Error('Group not found');

    // 3. Check if bet is resolved
    if (!group.resolved) throw new Error('Bet not resolved yet');

    // 4. Find member PDA
    const [memberPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('member'), new PublicKey(group.id).toBuffer(), new PublicKey(walletAddress).toBuffer()],
      program.programId
    );

    // 5. Claim on Solana
    const tx = await program.methods
      .claimWinnings()
      .accounts({
        member: memberPDA,
        group: new PublicKey(group.id),
        vaultTokenAccount: /* vault PDA */,
        userTokenAccount: /* user's USDC account */,
        user: new PublicKey(walletAddress),
        tokenProgram: /* token program */,
      })
      .rpc();

    // 6. Update Supabase
    await supabase.from('bets').update({
      claimed_at: new Date().toISOString(),
      claim_tx: tx,
    }).eq('group_id', groupId).eq('user_wallet', walletAddress);

    return tx;
  } catch (error) {
    console.error('Error claiming winnings:', error);
    throw error;
  }
}

/**
 * Resolve bet and update Supabase
 */
export async function resolveBetOnChain({
  groupId,
  winningSide,
  creatorWallet,
}: {
  groupId: string;
  winningSide: 'yes' | 'no';
  creatorWallet: string;
}) {
  try {
    const program = await getNoShotProgram();
    
    // Get group
    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (!group) throw new Error('Group not found');
    if (group.creator_wallet !== creatorWallet) throw new Error('Only creator can resolve');

    // Resolve on Solana
    const sideEnum = winningSide === 'yes' ? { yes: {} } : { no: {} };
    const tx = await program.methods
      .resolveBet(sideEnum)
      .accounts({
        group: new PublicKey(group.id),
        resolver: new PublicKey(creatorWallet),
      })
      .rpc();

    // Update Supabase
    await supabase.from('groups').update({
      resolved: true,
      winning_side: winningSide,
      resolved_at: new Date().toISOString(),
      resolution_tx: tx,
    }).eq('id', groupId);

    return tx;
  } catch (error) {
    console.error('Error resolving bet:', error);
    throw error;
  }
}

/**
 * Get NoShot program instance
 */
async function getNoShotProgram() {
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com');
  
  // Get provider (you'll need to get the wallet from Privy)
  const provider = new AnchorProvider(connection, /* wallet */, {
    commitment: 'confirmed',
  });

  // Load program
  const programId = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || 'YOUR_PROGRAM_ID');
  const program = new Program(/* IDL */, programId, provider);
  
  return program;
}

/**
 * Sync blockchain state with Supabase
 * Run this periodically to keep data in sync
 */
export async function syncBlockchainState(groupId: string) {
  const program = await getNoShotProgram();
  const groupPublicKey = new PublicKey(groupId);
  
  // Get group account from blockchain
  const groupAccount = await program.account.group.fetch(groupPublicKey);
  
  // Update Supabase
  await supabase.from('groups').update({
    total_yes: groupAccount.totalYes.toNumber(),
    total_no: groupAccount.totalNo.toNumber(),
    bets_open: groupAccount.betsOpen,
    resolved: groupAccount.winningSide !== null,
  }).eq('id', groupId);
}

/**
 * Calculate potential payout for a bet
 */
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
  
  return {
    stakeBack,
    shareOfLosers,
    totalPayout,
  };
}


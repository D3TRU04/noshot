import { Connection, PublicKey, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmRawTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount } from '@solana/spl-token';

// Simplified Solana client for NoShot betting

const DEFAULT_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

/**
 * Place a bet with real USDC transfer on devnet
 */
export async function placeRealBet({
  walletAddress,
  groupId,
  amount,
  side,
  signTransaction,
  toAddress,
}: {
  walletAddress: string;
  groupId: string;
  amount: number; // treated as SOL for testnet flow
  side: 'yes' | 'no';
  signTransaction: (tx: Transaction) => Promise<Transaction>; // Privy wallet signer
  toAddress?: string; // optional override for destination
}) {
  const rpcUrl = DEFAULT_RPC;
  const connection = new Connection(rpcUrl, 'confirmed');
  const fromPubkey = new PublicKey(walletAddress);
  const destination = toAddress || process.env.NEXT_PUBLIC_TREASURY;
  if (!destination) {
    throw new Error('Missing destination: provide toAddress or set NEXT_PUBLIC_TREASURY');
  }
  const toPubkey = new PublicKey(destination);

  if (fromPubkey.equals(toPubkey)) {
    console.warn('Sender and treasury are the same address; proceeding. Net effect will be only fees.', {
      sender: fromPubkey.toBase58(),
      treasury: toPubkey.toBase58(),
    });
  }

  // Convert amount SOL -> lamports; ensure positive non-zero
  const lamports = Math.max(1, Math.floor(amount * LAMPORTS_PER_SOL));

  console.log('🚀 Sending real SOL transfer on RPC:', rpcUrl);
  console.log('📝 Transfer details:', { from: fromPubkey.toBase58(), to: toPubkey.toBase58(), lamports, groupId, side });

  try {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');

    const tx = new Transaction({ feePayer: fromPubkey, recentBlockhash: blockhash }).add(
      SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
    );

    // Request user signature via provided signer
    const signed = await signTransaction(tx);

    const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

    console.log('✅ Confirmed SOL transfer on cluster:', rpcUrl, 'signature:', sig);
    return { success: true, tx: sig };
  } catch (error: any) {
    const enriched = new Error(
      `Transfer failed: ${error?.message || error}. Check treasury and wallet network.`
    );
    // Attach logs if present
    if (error && typeof error === 'object') {
      (enriched as any).logs = (error as any).logs;
    }
    console.error('❌ Error placing bet (SOL transfer):', error?.message || error, (error as any)?.logs || []);
    throw enriched;
  }
}

/**
 * Distribute SOL payouts from a single sending wallet to many recipients.
 * The caller must have the sending wallet active in Phantom to sign.
 */
export async function distributePayouts({
  fromWalletAddress,
  transfers,
  signTransaction,
}: {
  fromWalletAddress: string;
  transfers: Array<{ to: string; amountSol: number }>;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
}) {
  const rpcUrl = DEFAULT_RPC;
  const connection = new Connection(rpcUrl, 'confirmed');
  const fromPubkey = new PublicKey(fromWalletAddress);

  if (!Array.isArray(transfers) || transfers.length === 0) {
    throw new Error('No transfers specified');
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  const tx = new Transaction({ feePayer: fromPubkey, recentBlockhash: blockhash });

  for (const t of transfers) {
    const toPubkey = new PublicKey(t.to);
    const lamports = Math.max(1, Math.floor(t.amountSol * LAMPORTS_PER_SOL));
    tx.add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));
  }

  const signed = await signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

  console.log('✅ Payout transaction confirmed:', sig);
  return sig;
}

/**
 * Claim winnings from vault
 */
export async function claimRealWinnings({
  walletAddress,
  groupId,
  signTransaction,
}: {
  walletAddress: string;
  groupId: string;
  signTransaction: any;
}) {
  console.log('💰 Claiming REAL winnings from Solana vault on devnet...');
  
  // TODO: Implement actual claim on devnet
  // const program = await getProgram();
  // const tx = await program.methods
  //   .claimWinnings()
  //   .accounts({...})
  //   .rpc();
  
  return { success: true };
}

/**
 * Resolve bet (creator only)
 */
export async function resolveRealBet({
  groupId,
  winningSide,
  creatorWallet,
}: {
  groupId: string;
  winningSide: 'yes' | 'no';
  creatorWallet: string;
}) {
  console.log(`🎯 Resolving bet on Solana devnet with winning side: ${winningSide}`);
  
  // TODO: Implement actual resolve on devnet
  // const tx = await program.methods
  //   .resolveBet(...)
  //   .accounts({...})
  //   .rpc();
  
  return { success: true };
}


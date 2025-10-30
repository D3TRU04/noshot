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
  signTransaction: (tx: Transaction) => Promise<Transaction>; // wallet signer
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
    
  }

  // Convert amount SOL -> lamports; ensure positive non-zero
  const lamports = Math.max(1, Math.floor(amount * LAMPORTS_PER_SOL));

  

  try {
    // Basic balance check to avoid common simulation failure
    const currentBalance = await connection.getBalance(fromPubkey, 'processed');
    if (currentBalance <= 0) {
      throw new Error(`Sender has 0 SOL on this cluster (${rpcUrl}). Fund the wallet on testnet.`);
    }
    if (currentBalance < lamports) {
      throw new Error(`Insufficient SOL: balance=${(currentBalance / LAMPORTS_PER_SOL).toFixed(6)} < amount=${(lamports / LAMPORTS_PER_SOL).toFixed(6)}.`);
    }

    const trySend = async (): Promise<string> => {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      const tx = new Transaction({ feePayer: fromPubkey, recentBlockhash: blockhash }).add(
        SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
      );

      // Prefer signAndSendTransaction if wallet supports it (Phantom modern API)
      const anyGlobal: any = globalThis as any;
      const maybeProvider = anyGlobal?.solana;
      if (maybeProvider?.signAndSendTransaction) {
        const resp = await maybeProvider.signAndSendTransaction(tx);
        const sig: string = resp?.signature || resp; // some providers return { signature }
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
        return sig;
      }

      // Fallback: sign locally and send raw
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      return sig;
    };

    try {
      const sig = await trySend();
      console.log('Transaction successful:', sig);
      return { success: true, tx: sig };
    } catch (e: any) {
      // Retry once if blockhash or timing issues
      const message = String(e?.message || e);
      if (/blockhash/i.test(message) || /expired/i.test(message) || /not found/i.test(message)) {
        console.log('Retrying transaction due to:', message);
        const sig = await trySend();
        console.log('Transaction successful after retry:', sig);
        return { success: true, tx: sig };
      }
      console.error('Transaction failed:', e);
      throw e;
    }
  } catch (error: any) {
    let logs: any = undefined;
    try {
      if (error?.getLogs && typeof error.getLogs === 'function') {
        logs = await error.getLogs(connection);
      }
    } catch {}
    const msg = `Transfer failed: ${error?.message || error}.`;
    
    const enriched = new Error(`${msg}${logs ? ' Logs captured in console.' : ''}`);
    (enriched as any).logs = logs;
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

  // Calculate total needed
  const totalLamports = transfers.reduce((sum, t) => sum + Math.max(1, Math.floor(t.amountSol * LAMPORTS_PER_SOL)), 0);
  const totalSol = totalLamports / LAMPORTS_PER_SOL;
  console.log(`Paying out ${transfers.length} winners, total: ${totalSol.toFixed(6)} SOL`);
  
  // Check balance
  const balance = await connection.getBalance(fromPubkey, 'confirmed');
  const balanceSol = balance / LAMPORTS_PER_SOL;
  console.log(`Sender balance: ${balanceSol.toFixed(6)} SOL, needed: ${totalSol.toFixed(6)} SOL`);
  
  if (balance < totalLamports) {
    throw new Error(`Insufficient balance: have ${balanceSol.toFixed(6)} SOL, need ${totalSol.toFixed(6)} SOL`);
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  const tx = new Transaction({ feePayer: fromPubkey, recentBlockhash: blockhash });

  for (const t of transfers) {
    const toPubkey = new PublicKey(t.to);
    const lamports = Math.max(1, Math.floor(t.amountSol * LAMPORTS_PER_SOL));
    console.log(`  -> ${t.to.slice(0, 8)}...${t.to.slice(-4)}: ${(lamports / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
    tx.add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));
  }

  const signed = await signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

  
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
  
  
  // TODO: Implement actual resolve on devnet
  // const tx = await program.methods
  //   .resolveBet(...)
  //   .accounts({...})
  //   .rpc();
  
  return { success: true };
}


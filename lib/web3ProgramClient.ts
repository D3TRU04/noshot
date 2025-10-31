import { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID ? new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID) : null;

export function getConnection(): Connection {
  return new Connection(RPC_URL, 'confirmed');
}

export async function sendProgramInstruction(params: {
  payer: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  keys: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[];
  data: Buffer; // serialized instruction data matching your Rust program
}): Promise<string> {
  if (!PROGRAM_ID) throw new Error('Set NEXT_PUBLIC_PROGRAM_ID to your deployed program');
  const connection = getConnection();
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  const ix = new TransactionInstruction({ programId: PROGRAM_ID, keys: params.keys, data: params.data });
  const tx = new Transaction({ feePayer: params.payer, recentBlockhash: blockhash }).add(ix);
  const signed = await params.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
  return sig;
}

export const requiredPrograms = { SystemProgram: SystemProgram.programId };



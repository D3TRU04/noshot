import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Fetch SOL balance from devnet/mainnet
 */
export async function fetchSolBalance(walletAddress: string, cluster: 'mainnet-beta' | 'devnet' = 'mainnet-beta'): Promise<number> {
  try {
    const rpcUrl = cluster === 'devnet' 
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com';
    
    const connection = new Connection(rpcUrl, 'confirmed');
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    
    // Convert lamports to SOL
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
}

/**
 * Check if a wallet has Phantom connected and is on devnet
 */
export async function checkWalletNetwork(): Promise<'mainnet' | 'devnet' | 'unknown'> {
  try {
    // This will be called from Phantom's provider
    if (typeof window !== 'undefined' && (window as any).solana) {
      const provider = (window as any).solana;
      
      // Try to detect network
      if (provider.isPhantom) {
        // Connect to provider and check what network it's on
        // For now, return unknown since we can't directly query Phantom's network
        return 'unknown';
      }
    }
    
    return 'unknown';
  } catch (error) {
    console.error('Error checking wallet network:', error);
    return 'unknown';
  }
}

/**
 * Get USDC balance (placeholder - requires SPL token account)
 */
export async function fetchUsdcBalance(walletAddress: string, cluster: 'mainnet-beta' | 'devnet' = 'mainnet-beta'): Promise<number> {
  // USDC on Solana requires SPL token account lookup
  // For now, just return 0
  console.log('USDC balance fetching not yet implemented - requires SPL token integration');
  return 0;
}


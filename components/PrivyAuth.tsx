"use client";

import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import type {
  LinkedAccountWithMetadata,
  WalletWithMetadata,
} from "@privy-io/react-auth";

// Type guard → only wallets
function isWalletAccount(
  acc: LinkedAccountWithMetadata
): acc is WalletWithMetadata {
  return acc.type === "wallet";
}

// Helper → get the Solana wallet
export function getSolanaWallet(user: any) {
  if (!user?.linkedAccounts) return null;
  const wallets = user.linkedAccounts.filter(isWalletAccount);
  return wallets.find((w: WalletWithMetadata & { chainType?: string }) => w.chainType === "solana") || null;
}

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        appearance: {
          showWalletLoginFirst: true,
          walletChainType: "solana-only",
        },
        loginMethods: ["wallet", "sms"],
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
        
        embeddedWallets: {
          createOnLogin: "all-users",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

// Wallet button component
export function WalletButton() {
  const { login, logout, user, authenticated } = usePrivy();

  if (authenticated && user?.linkedAccounts?.length) {
    const solWallet = getSolanaWallet(user);

    console.log("User linkedAccounts:", user.linkedAccounts);
    console.log("Solana wallet:", solWallet);

    return (
      <div className="flex flex-col gap-2">
        {solWallet ? (
          <span className="text-sm text-neutral-300">
            Connected Solana wallet: {solWallet.address}
          </span>
        ) : (
          <span className="text-sm text-red-400">
            No Solana wallet connected
          </span>
        )}
        <button
          className="rounded-xl bg-white/10 px-4 py-2 hover:bg-white/20 transition"
          onClick={logout}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      className="w-full h-12 rounded-xl bg-cyan-400 text-black hover:bg-cyan-300 transition font-normal"
      onClick={login}
    >
      Connect Wallet
    </button>
  );
}

// Hooks
export function useWalletConnected() {
  const { authenticated } = usePrivy();
  return Boolean(authenticated);
}

export function useUser() {
  const { user } = usePrivy();
  return user;
}

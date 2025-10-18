"use client";

import React from "react";
import {
  PrivyProvider,
  usePrivy,
  useLogin,
  useLogout,
  type PrivyClientConfig,
} from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const PRIVY_APP_ID: string =
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clx1234567890abcdef";

const queryClient = new QueryClient();

/**
 * PrivyAuthProvider
 * Provides Privy authentication context for the app.
 * Ensures SMS logins create Solana wallets (not EVM).
 */
export function PrivyAuthProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const privyConfig: PrivyClientConfig = {
    appearance: {
      walletChainType: "solana-only",
      walletList: ["phantom"],
    },
    loginMethods: ["wallet", "sms"],

    // 👇 Ensure users logging in with phone numbers get a Solana wallet
   embeddedWallets: {
            solana: {
                createOnLogin: 'users-without-wallets',
            },
        },
    externalWallets: {
      solana: {
        connectors: toSolanaWalletConnectors(),
      },
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  );
}

/**
 * WalletButton
 * Renders login / logout button depending on auth state.
 */
export function WalletButton(): JSX.Element {
  const { ready, authenticated, user } = usePrivy();
  const { login } = useLogin();
  const { logout } = useLogout();

  if (!ready) return <button disabled>Loading...</button>;

  if (authenticated) {
    // Grab Solana wallet specifically
    const solanaWallet =
      user?.linkedAccounts?.find(
        (acc) => acc.type === "wallet" && acc.chainType === "solana"
      )?.address ?? "Unknown wallet";

    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-300">
          {solanaWallet.slice(0, 6)}...{solanaWallet.slice(-4)}
        </span>
        <button
          onClick={logout}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => login()}
      className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm hover:bg-white/20 transition"
    >
      Connect Phantom / Phone
    </button>
  );
}

/**
 * useWalletConnected
 * Returns true if authenticated and has a Solana wallet.
 */
export function useWalletConnected(): boolean {
  const { authenticated, user } = usePrivy();
  const hasSolanaWallet = user?.linkedAccounts?.some(
    (acc) => acc.type === "wallet" && acc.chainType === "solana"
  );

  return Boolean(authenticated && hasSolanaWallet);
}

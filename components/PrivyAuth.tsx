"use client";

import React, { useEffect } from "react";
import {
  PrivyProvider,
  usePrivy,
  useLogin,
  useLogout,
  type PrivyClientConfig,
} from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { upsertUserProfile } from "@/lib/supabaseProfiles";
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
      showWalletLoginFirst: true,
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

  useEffect(() => {
    if (authenticated && user) {
      const solanaWallet = user.linkedAccounts.find(
        (acc) => acc.type === "wallet" && acc.chainType === "solana"
      ) as { address?: string };
      const phone = user.linkedAccounts.find((acc) => acc.type === "phone");

      if (solanaWallet?.address) {
        upsertUserProfile({
          walletAddress: solanaWallet.address,
          phoneNumber: (phone as any)?.phoneNumber,
        }).then((profile) => {
          console.log("✅ Synced profile to Supabase:", profile);
        });
      }
    }
  }, [authenticated, user]);
  if (!ready) return <button disabled>Loading...</button>;

  if (authenticated) {
    // Find the Solana wallet (if it exists)
    const solanaWallet = user?.linkedAccounts?.find(
      (acc: any) => acc.type === "wallet" && acc.chainType === "solana"
    ) as { address?: string };

    const address = solanaWallet?.address;

    return (
      <div className="flex items-center gap-3">
        {address ? (
          <span className="text-sm text-neutral-300">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        ) : (
          <span className="text-sm text-red-400">No wallet found</span>
        )}

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

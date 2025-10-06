"use client";

import { useState } from "react";

// TODO: Uncomment when Privy is properly configured
// import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
// import { WagmiProvider } from "@privy-io/wagmi";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { createConfig, http } from "wagmi";
// import { mainnet, polygon, arbitrum, optimism } from "wagmi/chains";

// Placeholder for Privy App ID
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clx1234567890abcdef";

// TODO: Uncomment when Privy is properly configured
// const config = createConfig({
//   chains: [mainnet, polygon, arbitrum, optimism],
//   transports: {
//     [mainnet.id]: http(),
//     [polygon.id]: http(),
//     [arbitrum.id]: http(),
//     [optimism.id]: http(),
//   },
// });

// const queryClient = new QueryClient();

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  // TODO: Replace with actual Privy provider when configured
  return <>{children}</>;
  
  // Uncomment when Privy is properly configured:
  // return (
  //   <PrivyProvider
  //     appId={PRIVY_APP_ID}
  //     config={{
  //       appearance: {
  //         theme: "dark",
  //         accentColor: "#22d3ee",
  //       },
  //       embeddedWallets: {
  //         createOnLogin: "users-without-wallets",
  //       },
  //       loginMethods: ["email", "wallet", "sms"],
  //     }}
  //   >
  //     <QueryClientProvider client={queryClient}>
  //       <WagmiProvider config={config}>
  //         {children}
  //       </WagmiProvider>
  //     </QueryClientProvider>
  //   </PrivyProvider>
  // );
}

export function WalletButton() {
  // TODO: Replace with actual Privy hooks when configured
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState("");

  const handleConnect = () => {
    // TESTING MODE: Auto-connect for easy testing
    setIsConnected(true);
    setUserInfo("demo@example.com");
    console.log("[TEST MODE] Wallet connected automatically for testing");
  };

  const handleDisconnect = () => {
    // Placeholder: Simulate wallet disconnection
    setIsConnected(false);
    setUserInfo("");
    console.log("[TEST MODE] Wallet disconnected");
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-300">
          {userInfo || "Connected"}
        </span>
        <button
          onClick={handleDisconnect}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-normal backdrop-blur-md hover:bg-white/20 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-normal backdrop-blur-md hover:bg-white/20 transition-colors"
    >
      Connect Wallet
    </button>
  );
}

export function useWalletConnected() {
  // TESTING MODE: Always return true for easy testing
  return true;
  
  // TODO: Replace with actual Privy hook when configured:
  // const { authenticated, user } = usePrivy();
  // return Boolean(authenticated && user);
}

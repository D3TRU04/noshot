"use client";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";

export function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: { theme: "dark" },
        loginMethods: ["wallet"], // enables Phantom & other wallets
        
      
      
      }}
    >
      {children}
    </PrivyProvider>
  );
}

// Wallet button component
export function WalletButton() {
  const { login, logout, user, authenticated } = usePrivy();

  
  if (authenticated && user?.wallet) {
    console.log("AM I GETTING CALLED???")
    console.log(user)
    return (
      
      <div className="flex flex-col gap-2">
        <span className="text-sm text-neutral-300">
          Connected wallet: {user.wallet.address}
        </span>
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
      onClick={login} // Simply call login - it will show wallet options
    >
      Connect Wallet
    </button>
  );
}

// Hook to check wallet connection
export function useWalletConnected() {
  const { authenticated } = usePrivy();
  return Boolean(authenticated);
}

// Hook to get user info
export function useUser() {
  const { user } = usePrivy();
  return user;
}
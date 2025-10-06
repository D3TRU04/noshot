"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import PhoneInput from "@/components/PhoneInput";
import { WalletButton, useWalletConnected } from "@/components/PrivyAuth";
import { cn } from "@/lib/utils";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const walletConnected = useWalletConnected();
  const canPlay = useMemo(() => walletConnected, [walletConnected]);
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      {/* Main Content - Centered */}
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="mb-8 mt-8">
          <Logo />
        </div>

        {/* Main CTA Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-[0_10px_50px_-15px_rgba(0,0,0,0.5)]">
          <h1 className="mb-6 text-2xl font-normal text-neutral-200">
            Call your friends' chaos
          </h1>
          
          {/* Wallet Connection */}
          <div className="mb-6">
            <WalletButton />
          </div>

          {/* Play Button */}
          <button
            disabled={!canPlay}
            className={cn(
              "w-full h-12 rounded-xl text-base font-normal transition",
              canPlay ? "bg-cyan-400 text-black hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                      : "bg-white/10 text-neutral-400 cursor-not-allowed"
            )}
            onClick={() => {
              if (canPlay) {
                router.push('/group-selection');
              }
            }}
          >
            {!walletConnected ? "Connect wallet to continue" : "Start Playing"}
          </button>
        </div>

        {/* Simple Description */}
        <p className="text-sm text-neutral-400 max-w-sm mx-auto">
          Create micro-bets with friends. Settle in stablecoins. 
          <br />
          <span className="text-cyan-300">No shot you don't love it.</span>
        </p>
        
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          Connect your wallet to start creating and joining betting groups
        </p>
      </div>

      {/* About and How to Play Sections */}
      <div className="mt-16 w-full max-w-4xl grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="mb-3 text-lg font-normal text-neutral-200">About</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            noshot‼️ makes friendly wagers fun and fair. Spin up a private circle,
            post a "no shot he does X" bet, and let friends lock tiny stakes in stablecoins. 
            When reality happens, resolve by group vote or upload proof—payouts are instant and transparent.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="mb-3 text-lg font-normal text-neutral-200">How to play</h2>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-300 mt-1">•</span>
              <span>Create or join a friend circle</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-300 mt-1">•</span>
              <span>Post a micro-bet (e.g., "No shot Daniel survives 6th Street")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-300 mt-1">•</span>
              <span>Friends pick a side and stake small stablecoin amounts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-300 mt-1">•</span>
              <span>Resolve by group vote or photo/video proof</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-300 mt-1">•</span>
              <span>Winners auto-receive payouts. Brag, repeat</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 mb-8 text-xs text-neutral-500">
        © {new Date().getFullYear()} noshot‼️ — built for friend chaos
      </footer>
    </div>
  );
}

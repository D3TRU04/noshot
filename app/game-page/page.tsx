"use client";

import Logo from "@/components/Logo";
import BackButton from "@/components/BackButton";

export default function GamePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <BackButton />

      {/* Main Content - Centered */}
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="mb-8">
          <Logo />
        </div>

        {/* Game Placeholder */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-[0_10px_50px_-15px_rgba(0,0,0,0.5)]">
          <h1 className="mb-6 text-2xl font-normal text-neutral-200">
            Game in Progress
          </h1>
          <p className="text-sm text-neutral-300 mb-6">
            This is where the betting game will take place. 
            Features coming soon!
          </p>
          <div className="space-y-4">
            <div className="rounded-xl bg-white/5 p-4">
              <h3 className="text-lg font-normal text-neutral-200 mb-2">Current Bets</h3>
              <p className="text-sm text-neutral-400">No active bets yet</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <h3 className="text-lg font-normal text-neutral-200 mb-2">Players</h3>
              <p className="text-sm text-neutral-400">Waiting for players to join...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 mb-8 text-xs text-neutral-500">
        © {new Date().getFullYear()} noshot‼️ — built for friend chaos
      </footer>
    </div>
  );
}

"use client";

import { supabase } from "@/lib/supabaseClient";
import { usePrivy } from "@privy-io/react-auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import BackButton from "@/components/BackButton";
import type { LinkedAccountWithMetadata } from "@privy-io/react-auth";
export default function CreateGroup() {
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isInfinite, setIsInfinite] = useState(false);
  const [bettingTime, setBettingTime] = useState(24);
  const [groupCode, setGroupCode] = useState("");
  const [showFloatingInvite, setShowFloatingInvite] = useState(false);

  const { user } = usePrivy();
  const router = useRouter();

  const generateGroupCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  };

  const handleStart = async () => {
    if (!user) {
      alert("You must be logged in to create a group.");
      return;
    }

    const code = generateGroupCode();
    setGroupCode(code);

    const solanaWallet = user?.linkedAccounts.find(
  (acc: LinkedAccountWithMetadata) =>
    acc.type === "wallet" && acc.chainType === "solana"
);

// TypeScript now knows this is a wallet
const creatorWallet = solanaWallet && "address" in solanaWallet ? solanaWallet.address : null;

if (!creatorWallet) {
  alert("No Solana wallet found. Please reconnect.");
  return;
}

    // create group in Supabase
    const { data: group, error } = await supabase
      .from("groups")
      .insert({
        code,
        creator_wallet: creatorWallet,
        max_members: isInfinite ? null : maxPlayers,
        bet_duration_hours: bettingTime,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Error creating group: " + error.message);
      return;
    }

    // add creator as member
    await supabase.from("group_members").insert({
      group_id: group.id,
      wallet_address: creatorWallet,
    });

    // show floating invite popup
    setShowFloatingInvite(true);

    // redirect to game page after a short delay
    setTimeout(() => {
      router.push(`/group/${group.id}`);
    }, 1000); // 1 second delay to let them see the invite code briefly
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <BackButton />

      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mb-8">
          <Logo />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-[0_10px_50px_-15px_rgba(0,0,0,0.5)]">
          <h1 className="mb-6 text-2xl font-normal text-neutral-200">
            Create Group
          </h1>

          <div className="space-y-6">
            {/* Max Players */}
            <div>
              <label className="block text-sm text-neutral-300 mb-3">
                Maximum Players
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={isInfinite ? "" : maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 1)}
                disabled={isInfinite}
                className="w-24 mx-auto rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60 text-center"
              />
              <div className="flex items-center justify-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="infinite"
                  checked={isInfinite}
                  onChange={(e) => setIsInfinite(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-2 focus:ring-cyan-300/60"
                />
                <label htmlFor="infinite" className="text-sm text-neutral-300 cursor-pointer">
                  Infinite
                </label>
              </div>
            </div>

            {/* Betting Time */}
            <div>
              <label className="block text-sm text-neutral-300 mb-3">
                Betting Time (hours)
              </label>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setBettingTime(Math.max(1, bettingTime - 1))}
                  className="w-10 h-10 rounded-xl bg-white/10 text-neutral-300 hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  -
                </button>
                <div className="w-16 text-center">
                  <span className="text-2xl font-mono text-cyan-300">{bettingTime}</span>
                </div>
                <button
                  onClick={() => setBettingTime(Math.min(168, bettingTime + 1))}
                  className="w-10 h-10 rounded-xl bg-white/10 text-neutral-300 hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleStart}
              className="w-full h-12 rounded-xl bg-cyan-400 text-black font-normal hover:bg-cyan-300 transition-colors"
            >
              Start!
            </button>
          </div>
        </div>
      </div>

      {/* Floating Invite Code */}
      {showFloatingInvite && (
        <div className="fixed bottom-8 right-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center w-44 shadow-lg">
          <div className="text-lg font-mono text-cyan-300 mb-2">{groupCode}</div>
          <button
            onClick={() => navigator.clipboard.writeText(groupCode)}
            className="w-full rounded-xl bg-cyan-400 text-black text-sm py-1 hover:bg-cyan-300 transition-colors"
          >
            Copy Code
          </button>
        </div>
      )}
    </div>
  );
}

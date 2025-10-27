"use client";

import { supabase } from "@/lib/supabaseClient";
import { usePrivy } from "@privy-io/react-auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import BackButton from "@/components/BackButton";

export default function CreateGroup() {
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isInfinite, setIsInfinite] = useState(false);
  const [bettingTime, setBettingTime] = useState(24);
  const [groupCode, setGroupCode] = useState("");
  const [codeGenerated, setCodeGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user } = usePrivy();
  const router = useRouter();

  const generateGroupCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  };

  const handleGenerateCode = () => {
    const code = generateGroupCode();
    setGroupCode(code);
    setCodeGenerated(true);
  };

  const handleStart = async () => {
    if (!user) {
      alert("You must be logged in to create a group.");
      return;
    }

    // ✅ Get user's Solana wallet
    const solanaWallet = user.linkedAccounts.find(
      (acc) => acc.type === "wallet" && acc.chainType === "solana"
    ) as { address?: string } | undefined;

    const creatorWallet = solanaWallet?.address;
    if (!creatorWallet) {
      alert("No Solana wallet found. Please reconnect.");
      return;
    }

    if (!groupCode) {
      alert("Please generate a group code first.");
      return;
    }

    setLoading(true);

    // ✅ Create group
    const { data: group, error } = await supabase
      .from("groups")
      .insert({
        code: groupCode,
        creator_wallet: creatorWallet,
        max_members: isInfinite ? null : maxPlayers,
        bet_duration_hours: bettingTime,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Error creating group: " + error.message);
      setLoading(false);
      return;
    }

    // ✅ Add creator to group_members
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      wallet_address: creatorWallet,
      is_creator: true,
    });

    if (memberError) {
      console.error(memberError);
      alert("Error adding group member: " + memberError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push(`/group/${group.id}`);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-3 py-3 sm:px-4 sm:py-4 md:py-6">
      <BackButton />

      <div className="w-full max-w-lg space-y-3 sm:space-y-4 md:space-y-6 text-center">
        <div className="mb-1 sm:mb-2 md:mb-4">
          <Logo />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6 lg:p-8 backdrop-blur-md shadow-[0_10px_50px_-15px_rgba(0,0,0,0.5)]">
          <h1 className="mb-3 sm:mb-4 md:mb-5 text-lg sm:text-xl md:text-2xl font-normal text-neutral-200">
            Create Group
          </h1>

          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            {/* Max Players and Betting Time Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Max Players */}
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-xs sm:text-sm md:text-base text-neutral-300 text-center mb-1.5 sm:mb-2">
                  Maximum Players
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={isInfinite ? "" : maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 1)}
                  disabled={isInfinite}
                  className="w-full rounded-xl bg-white/5 px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60 text-center"
                />
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                  <input
                    type="checkbox"
                    id="infinite"
                    checked={isInfinite}
                    onChange={(e) => setIsInfinite(e.target.checked)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-2 focus:ring-cyan-300/60"
                  />
                  <label
                    htmlFor="infinite"
                    className="text-xs sm:text-sm text-neutral-300 cursor-pointer"
                  >
                    Infinite
                  </label>
                </div>
              </div>

              {/* Betting Time */}
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-xs sm:text-sm md:text-base text-neutral-300 text-center mb-1.5 sm:mb-2">
                  Betting Time
                  <span className="hidden sm:inline"> (hours)</span>
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setBettingTime(Math.max(1, bettingTime - 1))}
                    className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-white/10 text-neutral-300 hover:bg-white/20 transition-colors flex items-center justify-center text-sm sm:text-base font-medium"
                  >
                    -
                  </button>
                  <div className="w-14 sm:w-16 md:w-20 text-center">
                    <span className="text-xl sm:text-2xl md:text-3xl font-mono text-cyan-300">
                      {bettingTime}
                    </span>
                  </div>
                  <button
                    onClick={() => setBettingTime(Math.min(168, bettingTime + 1))}
                    className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-white/10 text-neutral-300 hover:bg-white/20 transition-colors flex items-center justify-center text-sm sm:text-base font-medium"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Generate / Start Buttons */}
            <div className="space-y-2.5 sm:space-y-3">
              {!codeGenerated ? (
                <button
                  onClick={handleGenerateCode}
                  className="w-full h-11 sm:h-12 md:h-14 rounded-xl bg-cyan-400 text-black text-sm sm:text-base md:text-lg font-normal hover:bg-cyan-300 transition-colors"
                >
                  Generate Code
                </button>
              ) : (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 sm:py-4 sm:px-5">
                    <p className="text-xs sm:text-sm text-neutral-400 mb-0.5 sm:mb-1">Your Group Code</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-mono text-cyan-300">{groupCode}</p>
                  </div>
                  <button
                    onClick={handleStart}
                    disabled={loading}
                    className="w-full h-11 sm:h-12 md:h-14 rounded-xl bg-cyan-400 text-black text-sm sm:text-base md:text-lg font-normal hover:bg-cyan-300 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Start!"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

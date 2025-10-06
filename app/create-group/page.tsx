"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import BackButton from "@/components/BackButton";
import { cn } from "@/lib/utils";

export default function CreateGroup() {
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isInfinite, setIsInfinite] = useState(false);
  const [bettingTime, setBettingTime] = useState(24);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [groupCode, setGroupCode] = useState("");

  const generateGroupCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleStart = () => {
    const code = generateGroupCode();
    setGroupCode(code);
    setShowInviteModal(true);
  };

  const handleInviteLink = () => {
    const code = generateGroupCode();
    setGroupCode(code);
    setShowInviteModal(true);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <BackButton />

      {/* Main Content - Centered */}
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="mb-8">
          <Logo />
        </div>

        {/* Create Group Card */}
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-center">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={isInfinite ? "" : maxPlayers}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setMaxPlayers(value);
                      }}
                      disabled={isInfinite}
                      className="w-24 rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60 placeholder:text-neutral-500 disabled:bg-white/5 disabled:text-neutral-500 disabled:cursor-not-allowed text-center"
                      placeholder="4"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="infinite"
                      checked={isInfinite}
                      onChange={(e) => {
                        setIsInfinite(e.target.checked);
                        if (e.target.checked) {
                          setMaxPlayers(0);
                        }
                      }}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-2 focus:ring-cyan-300/60"
                    />
                    <label htmlFor="infinite" className="text-sm text-neutral-300 cursor-pointer">
                      Infinite
                    </label>
                  </div>
                </div>
                {isInfinite && (
                  <p className="text-xs text-neutral-500">
                    Unlimited players allowed
                  </p>
                )}
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

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleStart}
                className="w-full h-12 rounded-xl bg-cyan-400 text-black font-normal hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 transition-colors"
              >
                Start!
              </button>
              
              <button
                onClick={handleInviteLink}
                className="w-full h-12 rounded-xl bg-white/10 text-neutral-200 font-normal hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors"
              >
                Generate Invite Link
              </button>
            </div>
          </div>

          <p className="mt-6 text-sm text-neutral-400">
            Set up your group settings and start betting with friends
          </p>
        </div>
      </div>

      {/* Invite Code Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 w-full max-w-sm">
            <h2 className="text-xl font-normal text-neutral-200 mb-4">Invite Friends</h2>
            <p className="text-sm text-neutral-400 mb-6">
              Share this code with your friends to let them join your group
            </p>
            
            <div className="space-y-4">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-mono tracking-widest text-cyan-300 mb-2">
                  {groupCode}
                </div>
                <p className="text-xs text-neutral-500">Group Code</p>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(groupCode);
                    // TODO: Show success message
                  }}
                  className="w-full rounded-xl bg-cyan-400 text-black font-normal hover:bg-cyan-300 transition-colors py-3"
                >
                  Copy Code
                </button>
                
                <button
                  onClick={() => {
                    const inviteUrl = `${window.location.origin}/join?code=${groupCode}`;
                    navigator.clipboard.writeText(inviteUrl);
                    // TODO: Show success message
                  }}
                  className="w-full rounded-xl bg-white/10 text-neutral-200 font-normal hover:bg-white/20 transition-colors py-3"
                >
                  Copy Invite Link
                </button>
              </div>
              
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full rounded-xl bg-white/5 text-neutral-400 font-normal hover:bg-white/10 transition-colors py-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

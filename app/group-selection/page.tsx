"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import BackButton from "@/components/BackButton";
import { cn } from "@/lib/utils";

export default function GroupSelection() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [groupCode, setGroupCode] = useState("");
  const router = useRouter();

  const generateGroupCode = () => {
    // Generate a random 6-character code
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateGroup = () => {
    router.push('/create-group');
  };

  const handleJoinGroup = () => {
    setShowJoinModal(true);
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

        {/* Group Selection Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-[0_10px_50px_-15px_rgba(0,0,0,0.5)]">
          <h1 className="mb-6 text-2xl font-normal text-neutral-200">
            Start Your Bet
          </h1>
          
          <div className="space-y-4">
            {/* Create Group Button */}
            <button
              onClick={handleCreateGroup}
              className="w-full h-14 rounded-xl bg-cyan-400 text-black font-normal hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 transition-colors"
            >
              Create New Group
            </button>

            {/* Join Group Button */}
            <button
              onClick={handleJoinGroup}
              className="w-full h-14 rounded-xl bg-white/10 text-neutral-200 font-normal hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors"
            >
              Join Existing Group
            </button>
          </div>

          <p className="mt-6 text-sm text-neutral-400">
            Create a group to start betting with friends, or join an existing group with a code.
          </p>
        </div>
      </div>

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 w-full max-w-sm">
            <h2 className="text-xl font-normal text-neutral-200 mb-4">Join Group</h2>
            <p className="text-sm text-neutral-400 mb-6">
              Enter the group code shared by your friend
            </p>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60 placeholder:text-neutral-500 text-center text-lg tracking-widest"
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                value={groupCode}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm font-normal hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (groupCode.length === 6) {
                      console.log(`Joining group with code: ${groupCode}`);
                      // TODO: Implement actual join logic
                      setShowJoinModal(false);
                    }
                  }}
                  disabled={groupCode.length !== 6}
                  className="flex-1 rounded-xl bg-cyan-400 text-black font-normal disabled:bg-white/10 disabled:text-neutral-400 disabled:cursor-not-allowed hover:bg-cyan-300 transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Code Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 w-full max-w-sm">
            <h2 className="text-xl font-normal text-neutral-200 mb-4">Group Created!</h2>
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
                onClick={() => setShowInviteModal(false)}
                className="w-full rounded-xl bg-white/10 text-neutral-200 font-normal hover:bg-white/20 transition-colors py-3"
              >
                Continue to Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

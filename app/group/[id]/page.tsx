"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Logo from "@/components/Logo";
import BackButton from "@/components/BackButton";
import { usePrivy } from "@privy-io/react-auth";

type Group = {
  id: string;
  code: string;
  name?: string;
  max_members: number | null;
  bet_duration_hours: number;
  created_at: string;
  creator_wallet: string;
};

type Member = {
  wallet_address: string;
  is_creator: boolean;
  joined_at: string;
};

export default function GroupPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = usePrivy();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!groupId) return;

    const fetchGroup = async () => {
      setLoading(true);

      // 1️⃣ Get group info
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (groupError || !groupData) {
        alert("Group not found.");
        router.push("/group-selection");
        return;
      }

      setGroup(groupData);

      // 2️⃣ Get members
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("wallet_address, is_creator, joined_at")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });

      if (membersError) {
        
      } else {
        setMembers(membersData || []);
      }

      setLoading(false);
    };

    fetchGroup();
  }, [groupId, router]);

  // Calculate time remaining
  useEffect(() => {
    if (!group) return;

    const updateTimer = () => {
      const now = new Date();
      const createdAt = new Date(group.created_at);
      const endTime = new Date(createdAt.getTime() + group.bet_duration_hours * 60 * 60 * 1000);
      
      const diff = endTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining("Betting closed");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [group]);

  const handleCreateBet = () => {
    router.push(`/group/${groupId}/create-bet`);
  };

  const handleViewBets = () => {
    router.push(`/group/${groupId}/bets`);
  };

  const handleInviteFriends = () => {
    // Copy group code to clipboard
    if (group) {
      navigator.clipboard.writeText(group.code);
      alert(`Group code ${group.code} copied to clipboard!`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh w-full flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-neutral-950 via-neutral-900/80 to-neutral-950/60 text-neutral-100 backdrop-blur-md">
        <div className="w-full max-w-md space-y-8 text-center">
          <Logo />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading group...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-dvh w-full flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-neutral-950 via-neutral-900/80 to-neutral-950/60 text-neutral-100 backdrop-blur-md">
        <BackButton />
        <div className="w-full max-w-md space-y-8 text-center">
          <Logo />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <h1 className="text-2xl font-normal text-neutral-200 mb-4">Group Not Found</h1>
            <p className="text-neutral-400 mb-6">This group doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => router.push("/group-selection")}
              className="w-full rounded-xl bg-cyan-400 text-black font-normal hover:bg-cyan-300 transition-colors py-3"
            >
              Back to Groups
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-start px-4 py-8 bg-gradient-to-b from-neutral-950 via-neutral-900/80 to-neutral-950/60 text-neutral-100 backdrop-blur-md">
      <BackButton />

      <div className="w-full max-w-4xl">
        {/* Group Header */}
        <div className="mb-8">
          <Logo />
          <div className="mt-6 text-center">
            <h1 className="text-3xl font-normal text-neutral-200 mb-2">
              {group.name || `Group ${group.code}`}
            </h1>
            <p className="text-neutral-400 text-sm mb-4">
              Code: <span className="font-mono text-cyan-300">{group.code}</span>
            </p>
          </div>
        </div>

        {/* Group Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Timer Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <h3 className="text-lg font-normal text-neutral-200 mb-2">Time Remaining</h3>
            <p className="text-2xl font-mono text-cyan-300">{timeRemaining}</p>
            <p className="text-xs text-neutral-400 mt-1">Betting period</p>
          </div>

          {/* Members Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <h3 className="text-lg font-normal text-neutral-200 mb-2">Members</h3>
            <p className="text-2xl font-mono text-cyan-300">{members.length}</p>
            <p className="text-xs text-neutral-400 mt-1">
              {group.max_members ? `of ${group.max_members} max` : "unlimited"}
            </p>
          </div>

          {/* Status Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <h3 className="text-lg font-normal text-neutral-200 mb-2">Status</h3>
            <p className="text-2xl font-mono text-cyan-300">
              {timeRemaining === "Betting closed" ? "Closed" : "Active"}
            </p>
            <p className="text-xs text-neutral-400 mt-1">Betting phase</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleCreateBet}
            disabled={timeRemaining === "Betting closed"}
            className="rounded-xl bg-cyan-400 text-black font-normal hover:bg-cyan-300 transition-colors py-4 disabled:bg-white/10 disabled:text-neutral-400 disabled:cursor-not-allowed"
          >
            Create New Bet
          </button>
          <button
            onClick={handleViewBets}
            className="rounded-xl bg-white/10 text-neutral-200 font-normal hover:bg-white/20 transition-colors py-4"
          >
            View All Bets
          </button>
        </div>

        {/* Members List */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md mb-8">
          <h3 className="text-lg font-normal text-neutral-200 mb-4">Group Members</h3>
          {members.length === 0 ? (
            <p className="text-neutral-400">No members yet</p>
          ) : (
            <div className="space-y-3">
              {members.map((member, index) => (
                <div key={member.wallet_address} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center">
                      <span className="text-sm font-mono text-cyan-300">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-mono text-neutral-300">
                        {member.wallet_address.slice(0, 8)}...{member.wallet_address.slice(-4)}
                      </p>
                      {member.is_creator && (
                        <span className="text-xs text-cyan-300">Creator</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite Section */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h3 className="text-lg font-normal text-neutral-200 mb-4">Invite Friends</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 rounded-xl bg-white/5 px-4 py-3">
              <p className="text-sm text-neutral-400">Group Code</p>
              <p className="text-xl font-mono text-cyan-300">{group.code}</p>
            </div>
            <button
              onClick={handleInviteFriends}
              className="rounded-xl bg-cyan-400 text-black font-normal hover:bg-cyan-300 transition-colors px-6 py-3"
            >
              Copy Code
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-3">
            Share this code with friends so they can join your group
          </p>
        </div>
      </div>
    </div>
  );
}

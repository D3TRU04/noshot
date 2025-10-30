"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabaseClient";
import { usePrivy } from "@privy-io/react-auth";

type Group = {
  id: string;
  code: string;
  max_members: number | null;
  memberCount?: number;
  created_at: string;
  bet_duration_hours: number;
};

export default function GroupSelection() {
  const router = useRouter();
  const { user } = usePrivy();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"live" | "past">("live");

  // Join states
  const [groupCodeInput, setGroupCodeInput] = useState("");

  // Create states
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isInfinite, setIsInfinite] = useState(false);
  const [bettingTime, setBettingTime] = useState(24);
  const [groupCode, setGroupCode] = useState("");
  const [codeGenerated, setCodeGenerated] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [betDescription, setBetDescription] = useState("");

  // Fetch user's groups
  useEffect(() => {
    if (!user) return;

    const fetchGroups = async () => {
      try {
        setLoading(true);

        const solanaWallet = user.linkedAccounts.find(
          (acc: any) => acc.type === "wallet" && acc.chainType === "solana"
        );
        const walletAddress = (solanaWallet as { address?: string })?.address ?? null;
        
        if (!walletAddress) {
          
          setGroups([]);
          setLoading(false);
          return;
        }

        

        // First, get group memberships
        const { data: memberships, error } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("wallet_address", walletAddress);

        if (error) {
          
          setGroups([]);
          setLoading(false);
          return;
        }

        

        if (!memberships || memberships.length === 0) {
          setGroups([]);
          setLoading(false);
          return;
        }

        // Get unique group IDs
        const groupIds = Array.from(new Set(memberships.map((m: any) => m.group_id)));

        

        // Fetch group details
        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("id, code, max_members, date_created, bet_duration_hours")
          .in("id", groupIds);

        if (groupsError) {
          
          setGroups([]);
          setLoading(false);
          return;
        }

        

        // Filter and map groups safely
        const fetchedGroups: Group[] = (groupsData || []).map((g: any) => ({
          id: g.id,
          code: g.code,
          max_members: g.max_members,
          created_at: g.date_created || new Date().toISOString(),
          bet_duration_hours: g.bet_duration_hours || 24,
        }));

        for (let i = 0; i < fetchedGroups.length; i++) {
          const { count } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", fetchedGroups[i].id);
          fetchedGroups[i].memberCount = count || 0;
        }

        

        setGroups(fetchedGroups);
        setLoading(false);
      } catch (err) {
        
        setGroups([]);
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  // Generate group code
  const generateGroupCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  };

  // Check if group is live (within betting window)
  const isGroupLive = (group: Group): boolean => {
    const now = new Date();
    const created = new Date(group.created_at);
    const expiry = new Date(created.getTime() + group.bet_duration_hours * 60 * 60 * 1000);
    return now < expiry;
  };

  // Filter groups based on active tab
  const filteredGroups = groups.filter((group) => {
    const isLive = isGroupLive(group);
    return activeTab === "live" ? isLive : !isLive;
  });

  // Handle Join
  const handleJoinGroup = async () => {
    if (!user) return;

    const solanaWallet = user.linkedAccounts.find(
      (acc: any) => acc.type === "wallet" && acc.chainType === "solana"
    );
    const walletAddress = (solanaWallet as { address?: string })?.address ?? null;
    if (!walletAddress) return;

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("code", groupCodeInput)
      .single();

    if (groupError || !group) {
      alert("Group not found!");
      return;
    }

    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (existing) {
      alert("You're already in this group!");
      return;
    }

    const { error: insertError } = await supabase.from("group_members").insert({
      group_id: group.id,
      wallet_address: walletAddress,
    });

    if (insertError) {
      alert("Error joining group: " + insertError.message);
      return;
    }

    alert("Joined group!");
    setShowModal(false);
    router.push(`/game/${group.id}`);
  };

  // Handle Create
  const handleCreateGroup = async () => {
    if (!user) {
      alert("You must be logged in to create a group.");
      return;
    }

    const solanaWallet = user.linkedAccounts.find(
      (acc: any) => acc.type === "wallet" && acc.chainType === "solana"
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

    setCreatingGroup(true);

    const { data: group, error } = await supabase
      .from("groups")
      .insert({
        code: groupCode,
        name: groupName || `Group ${groupCode}`,
        creator_wallet: creatorWallet,
        max_members: isInfinite ? null : maxPlayers,
        bet_duration_hours: bettingTime,
        bet_description: betDescription,
      })
      .select()
      .single();

    if (error) {
      
      alert("Error creating group: " + error.message);
      setCreatingGroup(false);
      return;
    }

    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      wallet_address: creatorWallet,
      is_creator: true,
    });

    if (memberError) {
      
      alert("Error adding group member: " + memberError.message);
      setCreatingGroup(false);
      return;
    }

    setCreatingGroup(false);
    setShowModal(false);
    router.push(`/game/${group.id}`);
  };

  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-start px-8 py-12 bg-gradient-to-b from-neutral-950 via-neutral-900/80 to-neutral-950/60 text-neutral-100 backdrop-blur-md">
      <BackButton />

      <div className="w-full max-w-6xl">
        <div className="flex flex-col items-center mb-10">
          <Logo />
          <h1 className="text-4xl font-normal text-neutral-200 mt-6">Your Groups</h1>
          <p className="text-neutral-400 mt-2 text-sm mb-8">
            Manage your friend circles or start a new one
          </p>

          {/* Tabs */}
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab("live")}
              className={`w-20 sm:w-24 px-6 py-2.5 rounded-lg font-normal transition-all text-center ${
                activeTab === "live"
                  ? "bg-cyan-400 text-black"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`w-20 sm:w-24 px-6 py-2.5 rounded-lg font-normal transition-all text-center ${
                activeTab === "past"
                  ? "bg-cyan-400 text-black"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Past
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-neutral-400 text-center">Loading groups...</p>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-400 text-lg mb-4">
              No {activeTab === "live" ? "live" : "past"} groups yet
            </p>
            {activeTab === "live" && (
              <button
                onClick={() => setShowModal(true)}
                className="rounded-xl bg-cyan-400 text-black font-normal hover:bg-cyan-300 transition-colors px-6 py-3"
              >
                Create Your First Group
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredGroups.map((g) => (
              <div
                key={g.id}
                onClick={() => router.push(`/game/${g.id}`)}
                className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-10 flex flex-col items-center justify-center hover:bg-white/10 transition-all backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] min-h-[220px]"
              >
                <p className="font-mono text-cyan-300 text-3xl mb-3 tracking-widest">{g.code}</p>
                {g.max_members && (
                  <p className="text-sm text-neutral-400">{g.max_members} max</p>
                )}
                <p className="text-sm text-neutral-400 mt-2">
                  {g.memberCount || 0} members
                </p>
              </div>
            ))}

            {/* Add new group card - only show on Live tab */}
            {activeTab === "live" && (
              <div
                onClick={() => setShowModal(true)}
                className="cursor-pointer rounded-2xl border border-white/10 bg-cyan-400/10 p-10 flex items-center justify-center text-7xl font-normal text-cyan-300 hover:bg-cyan-300/20 hover:text-cyan-200 transition-all backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] min-h-[220px]"
              >
                +
              </div>
            )}
          </div>
        )}
      </div>

      {/* JOIN / CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 w-full max-w-md shadow-xl overflow-y-auto max-h-[90vh] flex flex-col items-center justify-center">
            {/* Mode Selector */}
            {!joining && !creating && (
              <div className="w-full text-center space-y-4">
                <h2 className="text-2xl font-normal text-neutral-200 mb-6">Start or Join a Group</h2>
                <button
                  onClick={() => setJoining(true)}
                  className="w-full rounded-xl bg-cyan-400 text-black font-normal hover:bg-cyan-300 transition-colors py-3"
                >
                  Join Group
                </button>
                <button
                  onClick={() => setCreating(true)}
                  className="w-full rounded-xl bg-white/10 text-neutral-200 font-normal hover:bg-white/20 transition-colors py-3"
                >
                  Create Group
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-xl bg-white/5 text-neutral-400 font-normal hover:bg-white/10 transition-colors py-3"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Join Form */}
            {joining && (
              <div className="w-full text-center">
                <h2 className="text-2xl font-normal text-neutral-200 mb-4">Join Group</h2>
                <p className="text-sm text-neutral-400 mb-6">
                  Enter the 6-character group code
                </p>
                <input
                  type="text"
                  placeholder="Enter code"
                  maxLength={6}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60 placeholder:text-neutral-500 text-center text-lg tracking-widest mb-4"
                  onChange={(e) => setGroupCodeInput(e.target.value.toUpperCase())}
                  value={groupCodeInput}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setJoining(false)}
                    className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm font-normal hover:bg-white/20 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleJoinGroup}
                    disabled={groupCodeInput.length !== 6}
                    className="flex-1 rounded-xl bg-cyan-400 text-black font-normal disabled:bg-white/10 disabled:text-neutral-400 disabled:cursor-not-allowed hover:bg-cyan-300 transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            )}

            {/* Create Form */}
            {creating && (
              <div className="w-full text-center space-y-6">
                <h2 className="text-2xl font-normal text-neutral-200 mb-4">Create Group</h2>

                {/* Group Name */}
                <div>
                  <label className="block text-sm text-neutral-300 mb-3">
                    Group Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Friday Night Chaos"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60 placeholder:text-neutral-500 text-center"
                  />
                </div>

                {/* Bet Description */}
                <div>
                  <label className="block text-sm text-neutral-300 mb-3">
                    Bet Description
                  </label>
                  <textarea
                    placeholder="e.g., John is going to be first guy to be hammered tonight"
                    value={betDescription}
                    onChange={(e) => setBetDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60 placeholder:text-neutral-500 text-center resize-none"
                  />
                </div>

                {/* Max Players */}
                <div>
                  <label className="block text-sm text-neutral-300 mb-3">
                    Maximum Players
                  </label>
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={isInfinite ? "" : maxPlayers}
                      onChange={(e) =>
                        setMaxPlayers(parseInt(e.target.value) || 1)
                      }
                      disabled={isInfinite}
                      className="w-24 rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60 text-center"
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

                {/* Generate / Start */}
                {!codeGenerated ? (
                  <button
                    onClick={() => {
                      setGroupCode(generateGroupCode());
                      setCodeGenerated(true);
                    }}
                    className="w-full h-12 rounded-xl bg-cyan-400 text-black font-normal hover:bg-cyan-300 transition-colors"
                  >
                    Generate Code
                  </button>
                ) : (
                  <>
                    <div className="bg-white/5 border border-white/10 rounded-xl py-4">
                      <p className="text-sm text-neutral-400 mb-2">Your Group Code</p>
                      <p className="text-2xl font-mono text-cyan-300">{groupCode}</p>
                    </div>
                    <button
                      onClick={handleCreateGroup}
                      disabled={creatingGroup}
                      className="w-full h-12 rounded-xl bg-cyan-400 text-black font-normal hover:bg-cyan-300 transition-colors disabled:opacity-50"
                    >
                      {creatingGroup ? "Creating..." : "Start!"}
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setCreating(false);
                    setCodeGenerated(false);
                  }}
                  className="w-full rounded-xl bg-white/5 text-neutral-400 font-normal hover:bg-white/10 transition-colors py-3"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

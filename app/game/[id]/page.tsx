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
  date_created: string;
  creator_wallet: string;
  bet_description?: string;
  total_yes?: number;
  total_no?: number;
};

type Member = {
  wallet_address: string;
  is_creator: boolean;
  joined_at: string;
};

type Bet = {
  id: string;
  user_wallet: string;
  bet_amount: number;
  side: 'yes' | 'no';
  created_at: string;
};

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = usePrivy();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>("Loading...");
  const [betAmount, setBetAmount] = useState(1);
  const [betSide, setBetSide] = useState<'yes' | 'no'>('yes');
  const [placingBet, setPlacingBet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [betAnimation, setBetAnimation] = useState<'none' | 'yes' | 'no'>('none');
  const [settingsData, setSettingsData] = useState({
    name: '',
    betDescription: '',
    maxMembers: '',
    betDurationHours: 24
  });
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [totalYesPool, setTotalYesPool] = useState(0);
  const [totalNoPool, setTotalNoPool] = useState(0);

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
        console.error("Group fetch error:", groupError);
        alert("Group not found.");
        router.push("/group-selection");
        return;
      }

      console.log("Group data:", {
        id: groupData.id,
        date_created: groupData.date_created,
        bet_duration_hours: groupData.bet_duration_hours,
        name: groupData.name
      });

      setGroup(groupData);

      // 2️⃣ Get members
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("wallet_address, is_creator, joined_at")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });

      if (membersError) {
        console.error(membersError);
      } else {
        setMembers(membersData || []);
      }

      // 3️⃣ Get pool totals from group (stored in groups table)
      // Handle case where columns don't exist yet
      const yesPool = (groupData as any).total_yes ?? 0;
      const noPool = (groupData as any).total_no ?? 0;
      setTotalYesPool(yesPool);
      setTotalNoPool(noPool);
      
      // Get bets if table exists
      const { data: betsData } = await supabase
        .from('bets')
        .select('*')
        .eq('group_id', groupId);
      
      if (betsData) {
        setBets(betsData);
      } else {
        setBets([]);
      }
      
      // Populate settings data only if group exists
      if (groupData) {
        setSettingsData({
          name: groupData.name || '',
          betDescription: groupData.bet_description || '',
          maxMembers: groupData.max_members?.toString() || '',
          betDurationHours: groupData.bet_duration_hours || 24
        });
      }

      setLoading(false);
    };

    fetchGroup();
  }, [groupId, router]);

  // Calculate time remaining
  useEffect(() => {
    if (!group || !group.bet_duration_hours) {
      setTimeRemaining("Loading...");
      return;
    }

    const updateTimer = () => {
      try {
        const now = new Date();
        
        // Use timer start time if available (for updated durations), otherwise use date_created
        const startTime = timerStartTime || new Date(group.date_created);
        
        // Check if start time is valid
        if (isNaN(startTime.getTime())) {
          setTimeRemaining("Invalid date");
          return;
        }
        
        const endTime = new Date(startTime.getTime() + group.bet_duration_hours * 60 * 60 * 1000);
        const diff = endTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeRemaining("Betting closed");
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } catch (error) {
        console.error('Timer calculation error:', error);
        setTimeRemaining("Error calculating time");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [group, timerStartTime]);

  const isCreator = user && group && user.linkedAccounts?.find(
    (acc: any) => acc.type === "wallet" && acc.chainType === "solana" && acc.address === group.creator_wallet
  );

  // Calculate potential payout using proportional system
  const calculatePotentialPayout = () => {
    const userBet = betAmount;
    const yourSideTotal = betSide === 'yes' 
      ? totalYesPool + userBet 
      : totalNoPool + userBet;
    const otherSideTotal = betSide === 'yes' 
      ? totalNoPool 
      : totalYesPool;
    
    if (yourSideTotal === 0) return { stakeBack: 0, shareOfLosers: 0, totalPayout: 0 };
    
    const stakeBack = userBet;
    const userPercentage = userBet / yourSideTotal;
    const shareOfLosers = userPercentage * otherSideTotal;
    const totalPayout = stakeBack + shareOfLosers;
    
    return { stakeBack, shareOfLosers, totalPayout };
  };

  const potentialPayout = calculatePotentialPayout();

  const handlePlaceBet = async () => {
    if (!user || !group) return;

    const solanaWallet = user.linkedAccounts.find(
      (acc: any) => acc.type === "wallet" && acc.chainType === "solana"
    );
    const walletAddress = (solanaWallet as { address?: string })?.address ?? null;
    if (!walletAddress) {
      alert("No Solana wallet found. Please reconnect.");
      return;
    }

    if (timeRemaining === "Betting closed") {
      alert("Betting is closed for this group.");
      return;
    }

    setPlacingBet(true);
    setBetAnimation(betSide);

    try {
      console.log("Placing bet:", {
        groupId: group.id,
        wallet: walletAddress,
        side: betSide,
        amount: betAmount
      });

      console.log("🚀 Processing bet transaction...");
      
      // Note: This is currently a database-only operation
      // For real wallet charges on devnet, you need to:
      // 1. Sign transaction with Phantom/Privy
      // 2. Transfer USDC to vault on Solana devnet
      // 3. Deploy smart contract to devnet
      //
      // Right now: Just saves to Supabase, no wallet deduction
      
      // Simulate transaction processing
      console.log(`💵 Would charge wallet on devnet: $${betAmount} USDC`);
      console.log(`📤 Would transfer to Solana smart contract vault on devnet`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("✅ Transaction simulated (mock mode - no wallet charge)");

      // Update the groups table with new pool totals
      const newYesPool = betSide === 'yes' ? (totalYesPool + betAmount) : totalYesPool;
      const newNoPool = betSide === 'no' ? (totalNoPool + betAmount) : totalNoPool;
      
      // Try to update database (columns might not exist yet)
      const { error: updateError } = await supabase
        .from('groups')
        .update({
          total_yes: newYesPool,
          total_no: newNoPool,
        })
        .eq('id', group.id);

      if (updateError) {
        console.warn("Could not update pool in database:", updateError.message);
        console.log("💡 Add these columns to groups table in Supabase:");
        console.log("   ALTER TABLE groups ADD COLUMN IF NOT EXISTS total_yes NUMERIC DEFAULT 0;");
        console.log("   ALTER TABLE groups ADD COLUMN IF NOT EXISTS total_no NUMERIC DEFAULT 0;");
        // Still continue with UI update
      }

      // Update local state
      setTotalYesPool(newYesPool);
      setTotalNoPool(newNoPool);

      // Try to save individual bet (optional, for bet history)
      const { data: betData } = await supabase
        .from('bets')
        .insert({
          group_id: group.id,
          user_wallet: walletAddress,
          bet_amount: betAmount,
          side: betSide,
          created_at: new Date().toISOString(),
        })
        .select();
      
      if (betData && betData.length > 0) {
        setBets([...bets, betData[0]]);
      }

      alert(`🎉 Bet placed: $${betAmount} on ${betSide.toUpperCase()}!`);
      setBetAnimation('none');
      
    } catch (error) {
      console.error("Error placing bet:", error);
      alert("Failed to place bet: " + (error as Error).message);
    } finally {
      setPlacingBet(false);
    }
  };

  const handleInviteFriends = () => {
    if (group) {
      navigator.clipboard.writeText(group.code);
      alert(`Group code ${group.code} copied to clipboard!`);
    }
  };

  const handleSaveSettings = async () => {
    if (!group) return;

    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: settingsData.name || `Group ${group.code}`,
          bet_description: settingsData.betDescription,
          max_members: settingsData.maxMembers ? parseInt(settingsData.maxMembers) : null,
          bet_duration_hours: settingsData.betDurationHours
        })
        .eq('id', group.id);

      if (error) {
        console.error('Error updating group:', error);
        alert('Error updating group settings: ' + error.message);
        return;
      }

      // Check if betting duration changed
      const durationChanged = group.bet_duration_hours !== settingsData.betDurationHours;
      
      // Update local group data
      setGroup({
        ...group,
        name: settingsData.name || `Group ${group.code}`,
        bet_description: settingsData.betDescription,
        max_members: settingsData.maxMembers ? parseInt(settingsData.maxMembers) : null,
        bet_duration_hours: settingsData.betDurationHours
      });

      // If duration changed, reset timer to current time
      if (durationChanged) {
        setTimerStartTime(new Date());
        console.log('Timer reset due to duration change:', {
          oldDuration: group.bet_duration_hours,
          newDuration: settingsData.betDurationHours,
          newStartTime: new Date()
        });
      }

      alert('Group settings updated successfully!');
      setShowSettings(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Unexpected error updating settings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh w-full flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-neutral-950 via-neutral-900/80 to-neutral-950/60 text-neutral-100 backdrop-blur-md">
        <div className="w-full max-w-md space-y-8 text-center">
          <Logo />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-neutral-400">Loading game...</p>
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
            <h1 className="text-2xl font-normal text-neutral-200 mb-4">Game Not Found</h1>
            <p className="text-neutral-400 mb-6">This game doesn't exist or you don't have access to it.</p>
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
        {/* Game Header */}
        <div className="mb-8 text-center">
          <Logo />
          <div className="mt-10 text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
              <h1 className="text-3xl font-normal text-neutral-200">
                {group.name || `Group ${group.code}`}
              </h1>
              {isCreator && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="rounded-xl bg-white/10 text-neutral-300 hover:bg-white/20 transition-colors px-4 py-2 text-sm"
                >
                  ⚙️ Settings
                </button>
              )}
            </div>
            <p className="text-neutral-400 text-sm mb-4">
              Code: <span className="font-mono text-cyan-300">{group.code}</span>
            </p>
          </div>
        </div>

        {/* Game Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Timer Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <h3 className="text-lg font-normal text-neutral-200 mb-2">Time Remaining</h3>
            <p className="text-2xl font-mono text-cyan-300">{timeRemaining}</p>
            <p className="text-xs text-neutral-400 mt-1">Betting period</p>
          </div>

          {/* Members Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <h3 className="text-lg font-normal text-neutral-200 mb-2">Players</h3>
            <p className="text-2xl font-mono text-cyan-300">{members.length}</p>
            <p className="text-xs text-neutral-400 mt-1">
              {group.max_members ? `of ${group.max_members} max` : "unlimited"}
            </p>
          </div>

          {/* Total Pool Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <h3 className="text-lg font-normal text-neutral-200 mb-2">Total Pool</h3>
            <p className="text-2xl font-mono text-cyan-300">${(totalYesPool + totalNoPool).toFixed(2)}</p>
            <p className="text-xs text-neutral-400 mt-1">USDC across all bets</p>
          </div>
        </div>

        {/* Pool Breakdown */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md mb-8">
          <h3 className="text-lg font-normal text-neutral-200 mb-4">Pool Breakdown</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-green-400/10 border border-green-400/30 rounded-xl p-4">
              <p className="text-sm text-green-300 mb-2">YES Pool</p>
              <p className="text-3xl font-mono text-green-300">${totalYesPool.toFixed(2)}</p>
              <p className="text-xs text-neutral-400 mt-1">
                {totalYesPool + totalNoPool > 0 
                  ? `${((totalYesPool / (totalYesPool + totalNoPool)) * 100).toFixed(1)}% of pool`
                  : 'No bets yet'}
              </p>
            </div>
            <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-4">
              <p className="text-sm text-red-300 mb-2">NO Pool</p>
              <p className="text-3xl font-mono text-red-300">${totalNoPool.toFixed(2)}</p>
              <p className="text-xs text-neutral-400 mt-1">
                {totalYesPool + totalNoPool > 0 
                  ? `${((totalNoPool / (totalYesPool + totalNoPool)) * 100).toFixed(1)}% of pool`
                  : 'No bets yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Bet Description */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md mb-8">
          <h3 className="text-lg font-normal text-neutral-200 mb-4">The Bet</h3>
          <p className="text-neutral-300 text-lg leading-relaxed">
            {group.bet_description || "No bet description provided"}
          </p>
        </div>

        {/* Place Bet Section */}
        {timeRemaining !== "Betting closed" && (
          <div className={`rounded-2xl border p-6 backdrop-blur-md mb-8 transition-all duration-1000 ${
            betAnimation === 'yes' 
              ? 'border-green-400/50 bg-green-400/10 shadow-lg shadow-green-400/20' 
              : betAnimation === 'no'
              ? 'border-red-400/50 bg-red-400/10 shadow-lg shadow-red-400/20'
              : 'border-white/10 bg-white/5'
          }`}>
            <h3 className="text-lg font-normal text-neutral-200 mb-4">Place Your Bet</h3>
            
            <div className="space-y-4">
              {/* Bet Amount */}
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Bet Amount (USDC)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0.1)}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60 text-center"
                />
              </div>

              {/* Bet Side */}
              <div>
                <label className="block text-sm text-neutral-300 mb-3">Choose Your Side</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setBetSide('yes')}
                    className={`rounded-xl py-4 font-normal transition-all duration-300 ${
                      betSide === 'yes' 
                        ? 'bg-cyan-400 text-black' 
                        : betAnimation === 'yes'
                        ? 'bg-green-400/20 text-green-300 border border-green-400/50 animate-pulse'
                        : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                    }`}
                  >
                    {betAnimation === 'yes' ? '🎉 YES' : 'YES'}
                  </button>
                  <button
                    onClick={() => setBetSide('no')}
                    className={`rounded-xl py-4 font-normal transition-all duration-300 ${
                      betSide === 'no' 
                        ? 'bg-cyan-400 text-black' 
                        : betAnimation === 'no'
                        ? 'bg-red-400/20 text-red-300 border border-red-400/50 animate-pulse'
                        : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                    }`}
                  >
                    {betAnimation === 'no' ? '🎉 NO' : 'NO'}
                  </button>
                </div>
              </div>

              {/* Potential Payout Display */}
              {potentialPayout.totalPayout > 0 && (
                <div className="bg-gradient-to-r from-cyan-400/10 to-purple-400/10 border border-cyan-400/30 rounded-xl p-4">
                  <p className="text-sm text-neutral-400 mb-1">Potential Payout (if your side wins):</p>
                  <p className="text-2xl font-mono text-cyan-300">${potentialPayout.totalPayout.toFixed(2)}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    ${potentialPayout.stakeBack.toFixed(2)} back + ${potentialPayout.shareOfLosers.toFixed(2)} from losers
                  </p>
                </div>
              )}

              {/* Place Bet Button */}
              <button
                onClick={handlePlaceBet}
                disabled={placingBet || betAmount <= 0}
                className={`w-full rounded-xl font-normal transition-all duration-300 py-4 ${
                  placingBet 
                    ? 'bg-gradient-to-r from-cyan-400 to-green-400 text-black animate-pulse' 
                    : betAnimation !== 'none'
                    ? 'bg-gradient-to-r from-cyan-400 to-green-400 text-black shadow-lg shadow-cyan-400/30'
                    : 'bg-cyan-400 text-black hover:bg-cyan-300'
                } disabled:bg-white/10 disabled:text-neutral-400 disabled:cursor-not-allowed`}
              >
                {placingBet ? "🎯 Placing Bet..." : betAnimation !== 'none' ? "🎉 Bet Placed!" : `Place $${betAmount} Bet on ${betSide.toUpperCase()}`}
              </button>
            </div>
          </div>
        )}

        {/* Current Bets */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md mb-8">
          <h3 className="text-lg font-normal text-neutral-200 mb-4">Current Bets</h3>
          {bets.length === 0 ? (
            <p className="text-neutral-400">No bets placed yet. Be the first to bet!</p>
          ) : (
            <div className="space-y-3">
              {bets.map((bet) => (
                <div key={bet.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      bet.side === 'yes' ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'
                    }`}>
                      {bet.side.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-mono text-neutral-300">
                        {bet.user_wallet.slice(0, 8)}...{bet.user_wallet.slice(-4)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        ${bet.bet_amount} USDC
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {new Date(bet.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Players List */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md mb-8">
          <h3 className="text-lg font-normal text-neutral-200 mb-4">Players</h3>
          {members.length === 0 ? (
            <p className="text-neutral-400">No players yet</p>
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
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md mb-12">
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
            Share this code with friends so they can join and bet
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-normal text-neutral-200 mb-6 sticky top-0 bg-white/5 backdrop-blur-sm">Group Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Group Name</label>
                <input
                  type="text"
                  value={settingsData.name}
                  onChange={(e) => setSettingsData({...settingsData, name: e.target.value})}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60"
                  placeholder="Enter group name"
                />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Bet Description</label>
                <textarea
                  value={settingsData.betDescription}
                  onChange={(e) => setSettingsData({...settingsData, betDescription: e.target.value})}
                  rows={3}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60 resize-none"
                  placeholder="Enter bet description"
                />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Max Members</label>
                <input
                  type="number"
                  value={settingsData.maxMembers}
                  onChange={(e) => setSettingsData({...settingsData, maxMembers: e.target.value})}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60"
                  placeholder="Enter max members"
                />
              </div>
              
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Betting Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={settingsData.betDurationHours}
                  onChange={(e) => setSettingsData({...settingsData, betDurationHours: parseInt(e.target.value) || 24})}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60"
                  placeholder="Enter duration in hours"
                />
                <p className="text-xs text-neutral-400 mt-1">
                  Current: {group.bet_duration_hours} hours | New: {settingsData.betDurationHours} hours
                  {group.bet_duration_hours !== settingsData.betDurationHours && (
                    <span className="block text-cyan-300 mt-1">
                      ⚠️ Timer will reset to current time when saved
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 rounded-xl bg-white/10 text-neutral-300 hover:bg-white/20 transition-colors py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 rounded-xl bg-cyan-400 text-black hover:bg-cyan-300 transition-colors py-3"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

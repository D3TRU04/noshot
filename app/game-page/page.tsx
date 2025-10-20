"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Logo from "@/components/Logo";
import BackButton from "@/components/BackButton";

type Member = {
  wallet_address: string;
  last_login?: string;
};

export default function GamePage() {
  const router = useRouter();
  const pathname = usePathname(); // e.g. /group/123
  const groupId = pathname.split("/").pop(); // simple extract

  const [members, setMembers] = useState<Member[]>([]);
  const [groupCode, setGroupCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;

    const fetchGroup = async () => {
      setLoading(true);

      // 1️⃣ Get group info
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (groupError || !group) {
        alert("Group not found.");
        router.push("/group-selection");
        return;
      }

      setGroupCode(group.code);

      // 2️⃣ Get members
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("wallet_address")
        .eq("group_id", groupId);

      if (membersError) {
        console.error(membersError);
      } else {
        setMembers(membersData || []);
      }

      setLoading(false);
    };

    fetchGroup();
  }, [groupId, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <BackButton />

      {/* Main Content */}
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mb-8">
          <Logo />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-[0_10px_50px_-15px_rgba(0,0,0,0.5)]">
          <h1 className="mb-6 text-2xl font-normal text-neutral-200">
            Game in Progress
          </h1>

          {loading ? (
            <p className="text-neutral-400">Loading group data...</p>
          ) : (
            <>
              <p className="text-sm text-neutral-300 mb-4">
                Group Code: <span className="font-mono text-cyan-300">{groupCode}</span>
              </p>

              <div className="space-y-4">
                {/* Players */}
                <div className="rounded-xl bg-white/5 p-4">
                  <h3 className="text-lg font-normal text-neutral-200 mb-2">Players</h3>
                  {members.length === 0 ? (
                    <p className="text-sm text-neutral-400">Waiting for players...</p>
                  ) : (
                    <ul className="text-sm text-neutral-400 space-y-1">
                      {members.map((m) => (
                        <li key={m.wallet_address}>{m.wallet_address}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Current Bets (placeholder) */}
                <div className="rounded-xl bg-white/5 p-4">
                  <h3 className="text-lg font-normal text-neutral-200 mb-2">Current Bets</h3>
                  <p className="text-sm text-neutral-400">No active bets yet</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="mt-12 mb-8 text-xs text-neutral-500">
        © {new Date().getFullYear()} noshot‼️ — built for friend chaos
      </footer>
    </div>
  );
}

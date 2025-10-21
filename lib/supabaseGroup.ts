import { supabase } from "./supabaseClient";
export async function joinGroup({
  walletAddress,
  code,
}: {
  walletAddress: string;
  code: string;
}) {
  // find group by code
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, max_members")
    .eq("code", code)
    .single();

  if (groupError) throw groupError;
  if (!group) throw new Error("Group not found");

  // check if group is full
  if (group.max_members) {
    const { count } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", group.id);

    if (count && count >= group.max_members)
      throw new Error("Group is full");
  }

  // add user
  const { data, error } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      wallet_address: walletAddress,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}



export async function createGroup({
  creatorWallet,
  maxMembers,
  betDurationHours,
  groupName,
  betDescription,
}: {
  creatorWallet: string;
  maxMembers?: number | null;
  betDurationHours: number;
  groupName?: string;
  betDescription?: string;
}) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase(); // simple 6-char code

  const { data, error } = await supabase
    .from("groups")
    .insert({
      code,
      name: groupName || `Group ${code}`,
      creator_wallet: creatorWallet,
      max_members: maxMembers ?? null,
      bet_duration_hours: betDurationHours,
      bet_description: betDescription,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

import { supabase } from "./supabaseClient";

export type Proof = {
  id: string;
  group_id: string;
  uploader_wallet: string;
  side: "yes" | "no";
  image_url: string;
  caption?: string | null;
  approved: boolean;
  created_at: string;
};

export async function uploadProofImage(
  file: File,
  groupId: string,
  uploaderWallet: string
): Promise<string> {
  const path = `${groupId}/${uploaderWallet}-${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from("proofs")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("proofs").getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function createProof(params: {
  groupId: string;
  uploaderWallet: string;
  side: "yes" | "no";
  imageUrl: string;
  caption?: string;
}): Promise<Proof> {
  const { data, error } = await supabase
    .from("proofs")
    .insert({
      group_id: params.groupId,
      uploader_wallet: params.uploaderWallet,
      side: params.side,
      image_url: params.imageUrl,
      caption: params.caption ?? null,
      approved: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Proof;
}

export async function listProofs(groupId: string): Promise<Proof[]> {
  const { data, error } = await supabase
    .from("proofs")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Proof[]) || [];
}

export async function setProofApproval(params: {
  proofId: string;
  approved: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from("proofs")
    .update({ approved: params.approved })
    .eq("id", params.proofId);
  if (error) throw error;
}

export async function setOfficialOutcome(params: {
  groupId: string;
  winningSide: "yes" | "no";
  proofId: string;
}): Promise<void> {
  // Only mark as resolved when a specific approved proof is chosen by creator
  const { error } = await supabase
    .from("groups")
    .update({ resolved: true, winning_side: params.winningSide, resolved_proof_id: params.proofId, resolved_at: new Date().toISOString() })
    .eq("id", params.groupId);
  if (error) throw error;
}



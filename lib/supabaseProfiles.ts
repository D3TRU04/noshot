import { supabase } from "./supabaseClient";
export async function upsertUserProfile({
  walletAddress,
  phoneNumber,
}: {
  walletAddress: string;
  phoneNumber?: string;
}) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        wallet_address: walletAddress,
        phone_number: phoneNumber || null,
        last_login: new Date().toISOString(), // ✅ update timestamp
      },
      { onConflict: "wallet_address" }
    )
    .select().single();
     

  if (error) {
    console.error("Supabase profile error:", error.message);
    throw error;
  }

  return data?.[0];
}
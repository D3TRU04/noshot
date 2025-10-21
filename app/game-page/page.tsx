"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GamePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to group selection since this page is deprecated
    router.push("/group-selection");
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-neutral-400">Redirecting...</p>
        </div>
      </div>
    </div>
  );
}

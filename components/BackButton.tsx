"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <div className="absolute top-4 left-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-normal backdrop-blur-md hover:bg-white/20 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
    </div>
  );
}

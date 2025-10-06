import type { Metadata } from "next";
import "./globals.css";
import { PrivyAuthProvider } from "@/components/PrivyAuth";

export const metadata: Metadata = {
  title: "noshot‼️",
  description: "Friend prediction market with micro-bets & stablecoin payouts."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body><PrivyAuthProvider>{children}</PrivyAuthProvider></body></html>
  );
}

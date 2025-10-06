"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value?: string;
  onChange?: (v: string) => void;
  onVerified?: (phone: string) => void;
  className?: string;
}

export default function PhoneInput({
  value = "",
  onChange,
  onVerified,
  className
}: PhoneInputProps) {
  const [phone, setPhone] = useState(value);
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOtp = async () => {
    if (!phone.trim()) return;
    
    // TESTING MODE: Bypass OTP sending
    console.log(`[TEST MODE] Simulating OTP sent to ${phone}`);
    console.log("Note: OTP verification bypassed for testing. Use any 6-digit code.");
    setIsOtpSent(true);
    setCountdown(5); // Short countdown for testing
  };

  const verifyOtp = async () => {
    if (!otp.trim()) return;
    
    // TESTING MODE: Accept any 6-digit code
    console.log(`[TEST MODE] Verifying OTP: ${otp} for phone: ${phone}`);
    console.log("Note: OTP verification bypassed for testing.");
    
    // For testing purposes, accept any 6-digit code
    if (otp.length === 6) {
      setIsVerified(true);
      onVerified?.(phone);
      console.log(`[TEST MODE] Phone ${phone} verified successfully!`);
    } else {
      alert("Please enter a 6-digit code for testing.");
    }
  };

  const resendOtp = () => {
    if (countdown > 0) return;
    sendOtp();
  };

  if (isVerified) {
    return (
      <div className={cn("w-full", className)}>
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-sm text-green-300">Phone verified: {phone}</span>
          </div>
        </div>
      </div>
    );
  }

  if (isOtpSent) {
    return (
      <div className={cn("w-full space-y-3", className)}>
        <div>
          <label className="mb-2 block text-sm text-neutral-300">Enter OTP</label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="123456"
              maxLength={6}
              className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60 placeholder:text-neutral-500"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />
            <button
              onClick={verifyOtp}
              disabled={otp.length !== 6}
              className="rounded-xl bg-cyan-400 px-4 py-3 text-black font-normal disabled:bg-white/10 disabled:text-neutral-400 disabled:cursor-not-allowed hover:bg-cyan-300 transition-colors"
            >
              Verify
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Sent to {phone} (TEST MODE)</span>
          <button
            onClick={resendOtp}
            disabled={countdown > 0}
            className="text-cyan-400 hover:text-cyan-300 disabled:text-neutral-600 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <label className="mb-2 block text-sm text-neutral-300">Phone number *</label>
      <div className="flex gap-2">
        <input
          inputMode="tel" 
          autoComplete="tel" 
          placeholder="+1 512 555 0123"
          className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-cyan-300/60 placeholder:text-neutral-500"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            onChange?.(e.target.value);
          }}
        />
        <button
          onClick={sendOtp}
          disabled={!phone.trim()}
          className="rounded-xl bg-cyan-400 px-4 py-3 text-black font-normal disabled:bg-white/10 disabled:text-neutral-400 disabled:cursor-not-allowed hover:bg-cyan-300 transition-colors"
        >
          Send OTP
        </button>
      </div>
      <p className="mt-1 text-xs text-neutral-500">Required for account verification (TEST MODE: Any 6-digit code works)</p>
    </div>
  );
}

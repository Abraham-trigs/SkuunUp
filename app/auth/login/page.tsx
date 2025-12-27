"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Image from "next/image";
import { useAuthStore } from "@/app/store/useAuthStore.ts";
import { Lock, Mail, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const success = await login(email, password);

    if (success) {
      router.replace("/dashboard");
    } else {
      const authError = useAuthStore.getState().error;
      setError(authError?.message || "Invalid credentials provided");
    }

    setLoading(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">
      {/* Background Image with optimized blur */}
      <Image
        src="/main-4.webp"
        alt="School Background"
        fill
        className="object-cover object-top -z-10 scale-105 blur-[2px]"
        priority
      />

      {/* Dark Navy Overlay for better contrast */}
      <div className="absolute inset-0 bg-[#03102b]/60 -z-0"></div>

      {/* Login Card */}
      <div
        style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
        className="relative w-full max-w-md p-10 rounded-3xl border shadow-2xl z-10 animate-in fade-in zoom-in duration-500 shadow-[#6BE8EF]/5"
      >
        {/* Logo/Title Section */}
        <div className="text-center mb-8">
          <h1
            style={{ color: "#BFCDEF" }}
            className="text-4xl font-black tracking-tighter uppercase"
          >
            FORD SCHOOL
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div
              className="h-1 w-6 rounded-full"
              style={{ backgroundColor: "#6BE8EF" }}
            />
            <p className="text-[10px] font-bold text-[#BFCDEF] opacity-60 uppercase tracking-[0.3em]">
              Portal Access
            </p>
            <div
              className="h-1 w-6 rounded-full"
              style={{ backgroundColor: "#6BE8EF" }}
            />
          </div>
        </div>

        {error && (
          <div
            style={{ backgroundColor: "#E74C3C20", borderColor: "#E74C3C40" }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 border animate-shake"
          >
            <AlertCircle size={18} className="text-[#E74C3C] shrink-0" />
            <p className="text-[#E74C3C] text-xs font-bold uppercase tracking-wider">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email Field */}
          <div className="relative group">
            <Mail
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFCDEF] opacity-40 group-focus-within:opacity-100 transition-opacity"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              style={{
                backgroundColor: "#1c376e",
                color: "#BFCDEF",
                borderColor: "#BFCDEF33",
              }}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] focus:border-transparent transition-all placeholder:text-[#BFCDEF]/30 text-sm"
            />
          </div>

          {/* Password Field */}
          <div className="relative group">
            <Lock
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFCDEF] opacity-40 group-focus-within:opacity-100 transition-opacity"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{
                backgroundColor: "#1c376e",
                color: "#BFCDEF",
                borderColor: "#BFCDEF33",
              }}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] focus:border-transparent transition-all placeholder:text-[#BFCDEF]/30 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? "#1c376e" : "#6BE8EF",
              color: "#03102b",
            }}
            className={clsx(
              "mt-2 p-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95 shadow-lg",
              loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:brightness-110 shadow-[#6BE8EF]/10 hover:scale-[1.02]"
            )}
          >
            {loading ? "Verifying..." : "Secure Login"}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-bold text-[#BFCDEF] opacity-40  tracking-widest">
          &copy; 2025 SkuunUp.
        </p>
      </div>
    </div>
  );
}

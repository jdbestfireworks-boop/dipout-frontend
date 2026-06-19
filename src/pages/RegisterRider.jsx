import React, { useState } from "react";
import { Link } from "react-router-dom";
import backend from "@/api/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";
import { Mail, Lock, Loader2, MapPin, Star, Shield, ArrowLeft, CheckCircle2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const perks = [
  { icon: MapPin,  text: "Book rides instantly across Louisiana" },
  { icon: Zap,     text: "Get picked up in minutes" },
  { icon: Star,    text: "Rate your driver after every trip" },
  { icon: Shield,  text: "Safe, verified drivers every time" },
];

export default function RegisterRider() {
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [showOtp, setShowOtp]                 = useState(false);
  const [otpCode, setOtpCode]                 = useState("");

  const next = "/rider";

  // ⭐ FIXED — Use your backend, not Base44
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await backend.post("/register", {
        email,
        password,
        role: "rider"
      });

      setShowOtp(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ FIXED — Verify OTP using your backend
  const handleVerify = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await backend.post("/verify-otp", {
        email,
        otp: otpCode
      });

      const token = res.data.token;
      localStorage.setItem("token", token);

      window.location.href = next;
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code — please try again");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ FIXED — Resend OTP using your backend
  const handleResend = async () => {
    setError("");

    try {
      await backend.post("/resend-otp", { email });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-amber-950/40 via-background to-background p-12 border-r border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Dip Out" className="w-8 h-8 object-contain" />
          </div>
          <span className="font-display font-bold text-xl">Dip Out</span>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-display font-bold leading-tight">Your ride,<br />your way.</h2>
            <p className="text-muted-foreground mt-3 text-lg">Fast, affordable rides across Louisiana.</p>
          </div>

          <div className="space-y-4">
            {perks.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© 2025 Dip Out · Louisiana</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {!showOtp ? (
              <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>
                <div className="flex items-center gap-2 mb-8 lg:hidden">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" alt="Dip Out" className="w-6 h-6 object-contain" />
                  </div>
                  <span className="font-display font-bold">Dip Out</span>
                </div>

                <h1 className="text-3xl font-display font-bold mb-2">Rider Sign Up</h1>
                <p className="text-muted-foreground mb-6">Create your account</p>

                <Button variant="outline" className="w-full h-12 rounded-xl font-semibold gap-2 mb-5">
                  <GoogleIcon className="w-5 h-5" />
                  Continue with Google
                </Button>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground uppercase tracking-wider">or</span></div>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" placeholder="Email address" autoComplete="email" autoFocus
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl" required />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="password" placeholder="Password" autoComplete="new-password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl" required />
                  </div>

                  <div className="relative">

import React, { useState } from "react";
import { Link } from "react-router-dom";
import backend from "@/api/backend"; // ✅ FIXED — using your backend
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { Mail, Lock, Loader2, Car, MapPin, Star, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const perks = [
  { icon: MapPin, text: "Book rides instantly across Louisiana" },
  { icon: Car, text: "Drive and earn on your schedule" },
  { icon: Star, text: "Keep 80% of every fare as a driver" },
  { icon: Shield, text: "Safe, verified drivers every time" },
];

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "/";
  const isDriverFlow = next.includes("driver");

  // ⭐ FIXED — now uses your backend route
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
      });

      setShowOtp(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ FIXED — your backend OTP route
  const handleVerify = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await backend.post("/verify-otp", {
        email,
        otp: otpCode,
      });

      if (result?.data?.token) {
        localStorage.setItem("token", result.data.token);
      }

      window.location.href = next;
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code — please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");

    try {
      await backend.post("/resend-otp", { email });
      toast({ title: "Code resent", description: "Check your inbox." });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-purple-950 via-background to-background p-12 border-r border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl">Dip Out</span>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-display font-bold leading-tight">
              {isDriverFlow ? "Start earning\ntoday." : "Your ride,\nyour way."}
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              {isDriverFlow
                ? "Join the Dip Out driver network and set your own hours."
                : "Fast, affordable rides across Louisiana."}
            </p>
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
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl font-display font-bold mb-6">
                  Create your account
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Confirm Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account →"}
                  </Button>
                </form>

                <p className="text-center text-sm mt-4">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-medium">
                    Log in
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl font-display font-bold mb-4">
                  Enter verification code
                </h1>

                <p className="text-muted-foreground mb-6">
                  We sent a 6‑digit code to <strong>{email}</strong>
                </p>

                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                {error && (
                  <p className="text-red-500 text-sm mt-3">{error}</p>
                )}

                <Button onClick={handleVerify} className="w-full mt-6" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify →"}
                </Button>

                <button
                  onClick={handleResend}
                  className="text-sm text-primary mt-4 w-full text-center"
                >
                  Resend code
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

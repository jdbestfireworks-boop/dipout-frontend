import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
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

  const next = new URLSearchParams(window.location.search).get("next") || "/rider";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.href = next;
    } catch (err) {
      setError(err.message || "Invalid code — please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
    } catch (err) {
      setError(err.message || "Failed to resend");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-amber-950/40 via-background to-background p-12 border-r border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
            <img src="https://media.base44.com/images/public/6a2adf5a7f92459340d0efc2/925d1fd18_generated_image.png" alt="Dip Out" className="w-8 h-8 object-contain" />
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
                    <img src="https://media.base44.com/images/public/6a2adf5a7f92459340d0efc2/925d1fd18_generated_image.png" alt="Dip Out" className="w-6 h-6 object-contain" />
                  </div>
                  <span className="font-display font-bold">Dip Out</span>
                </div>

                <div className="mb-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">Rider Sign Up</span>
                </div>
                <div className="mb-8">
                  <h1 className="text-3xl font-display font-bold">Create your account</h1>
                  <p className="text-muted-foreground mt-1 text-sm">Sign up to book your first ride</p>
                </div>

                <Button variant="outline" className="w-full h-12 rounded-xl font-medium mb-5 gap-2"
                  onClick={() => base44.auth.loginWithProvider("google", next)}>
                  <GoogleIcon className="w-4 h-4" />
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
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="password" placeholder="Confirm password" autoComplete="new-password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl" required />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl font-bold text-base mt-2" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : "Create Rider Account →"}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
                </p>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Want to drive?{" "}
                  <Link to="/register/driver" className="text-primary font-semibold hover:underline">Driver sign up →</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>
                <button onClick={() => setShowOtp(false)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                    <Mail className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-3xl font-display font-bold">Check your email</h1>
                  <p className="text-muted-foreground mt-1 text-sm">
                    We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>
                  </p>
                </div>
                {error && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
                )}
                <div className="flex justify-center mb-6">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
                    <InputOTPGroup>
                      <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                      <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button className="w-full h-12 rounded-xl font-bold text-base gap-2"
                  onClick={handleVerify} disabled={loading || otpCode.length < 6}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <><CheckCircle2 className="w-4 h-4" /> Verify & Continue</>}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-5">
                  Didn't get it?{" "}
                  <button onClick={handleResend} className="text-primary font-semibold hover:underline">Resend code</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
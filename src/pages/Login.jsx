import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2, Car, MapPin, Star, Shield } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { motion } from "framer-motion";

const perks = [
  { icon: MapPin,  text: "Book rides instantly across Louisiana" },
  { icon: Car,     text: "Drive and earn on your schedule" },
  { icon: Star,    text: "Keep 80% of every fare as a driver" },
  { icon: Shield,  text: "Safe, verified drivers every time" },
];

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
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
            <h2 className="text-4xl font-display font-bold leading-tight">Welcome<br />back.</h2>
            <p className="text-muted-foreground mt-3 text-lg">Your rides are waiting for you.</p>
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
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Car className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">Dip Out</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold">Welcome back</h1>
            <p className="text-muted-foreground mt-1 text-sm">Log in to your account</p>
          </div>

          <Button
            variant="outline"
            className="w-full h-14 rounded-xl font-bold text-base mb-6 gap-3"
            onClick={() => base44.auth.loginWithProvider("google", "/")}
          >
            <GoogleIcon className="w-5 h-5" />
            Continue with Google
          </Button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground uppercase tracking-wider">or</span></div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
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
              <Input type="password" placeholder="Password" autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                className="pl-10 h-12 rounded-xl" required />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" className="w-full h-14 rounded-xl font-bold text-lg" disabled={loading}>
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Logging in…</> : "Log in →"}
            </Button>
          </form>

          <div className="space-y-3 text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">Create one</Link>
            </p>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground uppercase tracking-wider">or</span></div>
            </div>
            <Link
              to="/register/rider"
              className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary font-bold text-base hover:bg-primary/10 transition-colors"
            >
              <Car className="w-5 h-5" />
              New rider? Create an account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
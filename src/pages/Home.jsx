import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, UserPlus, Zap, Shield, Star, DollarSign, MapPin, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Back button */}
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-12 max-w-2xl mx-auto space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Car className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-5xl font-display font-bold tracking-tight">
          Get there with <span className="text-primary">Dip Out</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Fast, affordable rides — or earn money driving on your own schedule.
        </p>
      </section>

      {/* Two big CTA cards */}
      <section className="max-w-2xl mx-auto px-6 pb-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Rider card */}
        <div className="rounded-3xl border border-border bg-card p-7 flex flex-col gap-5">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">Ride with us</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Book a ride in seconds. AI-powered pricing, real-time tracking, and in-app chat with your driver.
            </p>
          </div>
          <div className="flex flex-col gap-3 mt-auto">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-6 py-5 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity text-lg shadow-lg shadow-primary/30 hover:scale-[1.02]"
            >
              <MapPin className="w-6 h-6" /> Book a ride now
            </Link>
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 border-border font-bold hover:bg-accent transition-all text-base hover:scale-[1.02]"
            >
              <UserPlus className="w-5 h-5" /> Create rider account
            </Link>
          </div>
        </div>

        {/* Driver card */}
        <div className="rounded-3xl border border-primary/30 bg-primary/5 p-7 flex flex-col gap-5">
          <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">Drive with us</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Set your own hours, earn more with surge zones, and get paid instantly after every trip.
            </p>
          </div>
          <div className="flex flex-col gap-3 mt-auto">
            <Link
              to="/driver"
              className="flex items-center justify-center gap-2 px-6 py-5 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity text-lg shadow-lg shadow-primary/30 hover:scale-[1.02]"
            >
              <Car className="w-6 h-6" /> Go to driver hub
            </Link>
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 border-primary/50 font-bold hover:bg-primary/10 transition-all text-base hover:scale-[1.02] text-primary"
            >
              <UserPlus className="w-5 h-5" /> Create driver account
            </Link>
          </div>
        </div>
      </section>

      {/* Chat CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-8">
        <Link
          to="/chat"
          className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:bg-accent/40 transition-colors group"
        >
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Ride Messages</p>
            <p className="text-xs text-muted-foreground mt-0.5">Chat with your driver or rider from any trip →</p>
          </div>
        </Link>
      </section>

      {/* Feature highlights */}
      <section className="max-w-3xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { icon: Zap,        title: 'Instant matching',   desc: 'Get paired with a nearby driver in seconds.' },
          { icon: Shield,     title: 'Safe & reliable',    desc: 'Every ride is tracked with safety features built in.' },
          { icon: Star,       title: 'AI pricing',         desc: 'Dynamic fares that are always fair and transparent.' },
          { icon: DollarSign, title: 'Earn more',          desc: 'Drivers keep 80% of every fare plus tips.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
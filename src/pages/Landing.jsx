import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LandingSignUp from "@/components/landing/LandingSignUp";
import { TIER_PRICES, TIER_LABELS, TIER_DESCRIPTIONS, TIER_FEATURES } from "@/lib/wedding";
import {
  Calendar, Wallet, Heart, Palette, Users, Sparkles,
  Check, ArrowRight, Smartphone, LogIn
} from "lucide-react";

const FEATURES = [
  { icon: Calendar, title: "Timeline Builder", desc: "Craft a minute-by-minute timeline and optimize it with AI." },
  { icon: Wallet, title: "Budget Tracker", desc: "Track estimates, deposits, and balances across every category." },
  { icon: Heart, title: "AI Vow Companion", desc: "Write heartfelt vows with guided prompts and AI structuring." },
  { icon: Palette, title: "Mood Board", desc: "Collect colors, inspiration photos, and style notes in one place." },
  { icon: Users, title: "Guests & Seating", desc: "Manage RSVPs, meal choices, and drag-and-drop seating charts." },
  { icon: Sparkles, title: "Moment Ideas", desc: "Get AI-generated wedding moment ideas delivered monthly." },
];

const TIERS = [
  { key: "single_day", badge: "Starter" },
  { key: "multiday", badge: "Most Popular" },
  { key: "destination", badge: "Full Package" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="serif-heading text-2xl text-primary">Vows & Veil</span>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/about" className="text-muted-foreground hover:text-primary">About</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-primary">Contact</Link>
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">
                <LogIn className="w-4 h-4 mr-1.5" />
                Log in
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero + Sign-up */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-primary font-medium mb-4">
              Your wedding, beautifully planned
            </p>
            <h1 className="serif-heading text-5xl lg:text-6xl leading-tight text-foreground mb-6">
              Every detail of your day, in one elegant place.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              Timeline scheduling, budget tracking, guest management, AI vows,
              and a mood board — built for couples who want it all without the chaos.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#signup">
                <Button size="lg" className="font-medium">
                  Start free <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
              <a href="#features">
                <Button variant="outline" size="lg">Explore features</Button>
              </a>
            </div>
          </div>
          <div id="signup">
            <LandingSignUp />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 lg:py-24 bg-secondary/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-primary font-medium mb-3">
              Everything you need
            </p>
            <h2 className="serif-heading text-4xl text-foreground">
              Tools for every moment
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="elegant-card p-6">
                  <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="serif-heading text-xl mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.2em] uppercase text-primary font-medium mb-3">
              One-time purchase
            </p>
            <h2 className="serif-heading text-4xl text-foreground mb-3">
              Choose your tier
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Pay once, plan forever. Pick the tier that fits your celebration —
              upgrade anytime.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            {TIERS.map((t, i) => (
              <div
                key={t.key}
                className={`elegant-card p-7 relative flex flex-col ${
                  i === 1 ? "ring-2 ring-primary lg:scale-[1.03] lg:-mt-2" : ""
                }`}
              >
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap ${
                  i === 1 ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                }`}>
                  {t.badge}
                </span>
                <h3 className="serif-heading text-2xl text-foreground mt-2 mb-1">
                  {TIER_LABELS[t.key]}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {TIER_DESCRIPTIONS[t.key]}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="serif-heading text-4xl text-primary">
                    ${TIER_PRICES[t.key]}
                  </span>
                  <span className="text-sm text-muted-foreground">one-time</span>
                </div>
                <div className="soft-divider my-5" />
                <ul className="space-y-2.5 mb-7 flex-1">
                  {TIER_FEATURES[t.key].slice(0, 6).map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground capitalize">
                        {feat.replace(/_/g, " ")}
                      </span>
                    </li>
                  ))}
                  {TIER_FEATURES[t.key].length > 6 && (
                    <li className="text-xs text-muted-foreground pl-6">
                      + {TIER_FEATURES[t.key].length - 6} more features
                    </li>
                  )}
                </ul>
                <a href="#signup">
                  <Button
                    variant={i === 1 ? "default" : "outline"}
                    className="w-full"
                  >
                    Get started
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile coming soon */}
      <section className="py-16 bg-secondary/40">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <h2 className="serif-heading text-3xl text-foreground mb-3">
            Mobile app coming soon
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            Your wedding plans will travel with you. The Vows & Veil mobile app
            for iOS and Android is on the way — your account syncs seamlessly
            between web and mobile.
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground">
              <Smartphone className="w-4 h-4" />
              App Store — soon
            </div>
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground">
              <Smartphone className="w-4 h-4" />
              Google Play — soon
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="serif-heading text-xl text-primary">Vows & Veil</span>
          <p className="text-xs text-muted-foreground">
            Your wedding, beautifully planned. © {new Date().getFullYear()}
          </p>
          <div className="flex gap-4 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-primary">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary">Pricing</a>
            <Link to="/about" className="text-muted-foreground hover:text-primary">About</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-primary">Contact</Link>
            <Link to="/login" className="text-muted-foreground hover:text-primary">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
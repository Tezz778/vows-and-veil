import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Wallet, Heart, Palette, Users, Sparkles, ArrowRight } from "lucide-react";

const VALUES = [
  { icon: Calendar, title: "Timeline scheduling", desc: "Build a minute-by-minute timeline and optimize it with AI." },
  { icon: Wallet, title: "Budget tracking", desc: "Track estimates, deposits, and balances across every category." },
  { icon: Users, title: "Guest management", desc: "Manage RSVPs, meal choices, and seating charts with ease." },
  { icon: Heart, title: "Vow writing tool", desc: "Guided questions and AI assistance to help you write vows in your own voice." },
  { icon: Palette, title: "Mood board", desc: "Collect colors, inspiration photos, and style notes in one place." },
  { icon: Sparkles, title: "Wedding website", desc: "Share your day with guests through a beautiful public site." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/landing" className="serif-heading text-2xl text-primary">Vows & Veil</Link>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/landing" className="text-muted-foreground hover:text-primary">Home</Link>
            <Link to="/about" className="text-foreground font-medium">About</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-primary">Contact</Link>
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs tracking-[0.2em] uppercase text-primary font-medium mb-4">
            Our story
          </p>
          <h1 className="serif-heading text-4xl lg:text-5xl text-foreground mb-8 leading-tight">
            About Vows & Veil
          </h1>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              Vows & Veil is an all-in-one digital wedding assistant built for engaged
              couples who want to plan their celebration with intention — not chaos. We
              bring timeline scheduling, budget tracking, guest management, AI-powered
              vow writing, mood boards, and a shareable wedding website into a single,
              elegant workspace. Instead of juggling spreadsheets, sticky notes, and a
              dozen browser tabs, couples can keep every detail of their day in one
              beautifully designed place that grows with them from engagement to "I do."
            </p>
            <p>
              We built Vows & Veil for couples at every stage of planning — whether you're
              organizing an intimate single-day ceremony, a multiday weekend celebration,
              or a destination wedding with travel logistics and itineraries. Our tiered
              plans scale to fit your needs, and our AI tools help with the moments that
              matter most: structuring your vows, generating speech ideas, optimizing your
              timeline, and surfacing creative wedding moment ideas throughout your
              engagement. Every feature is designed to feel calm, deliberate, and
              genuinely helpful — never overwhelming.
            </p>
            <p>
              Vows & Veil is built by a small, dedicated team of designers and engineers who
              believe wedding planning shouldn't feel like a second job. We're passionate
              about creating tools that respect your time, your budget, and your story —
              so you can focus on what actually matters: each other, and the day you've
              been dreaming of.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/40">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="serif-heading text-3xl text-foreground text-center mb-12">
            What we offer
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="elegant-card p-6 flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="serif-heading text-xl mb-1">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="serif-heading text-3xl text-foreground mb-4">
            Ready to start planning?
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Create your free account and start building your wedding day today.
          </p>
          <Button asChild size="lg">
            <Link to="/landing">
              Get started <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/landing" className="serif-heading text-xl text-primary">Vows & Veil</Link>
          <p className="text-xs text-muted-foreground">
            Your wedding, beautifully planned. © {new Date().getFullYear()}
          </p>
          <div className="flex gap-4 text-sm">
            <Link to="/landing" className="text-muted-foreground hover:text-primary">Home</Link>
            <Link to="/about" className="text-muted-foreground hover:text-primary">About</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-primary">Contact</Link>
            <Link to="/login" className="text-muted-foreground hover:text-primary">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
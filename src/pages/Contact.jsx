import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Loader2, CheckCircle2, MessageCircle } from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setError("Please enter a valid email address");
    if (message.trim().length < 10)
      return setError("Please enter a message (at least 10 characters)");

    setLoading(true);
    try {
      const res = await base44.functions.invoke("send-contact-email", {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      if (res?.data?.ok) {
        setSent(true);
      } else {
        setError(res?.data?.error || "Could not send message. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Could not send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/landing" className="serif-heading text-2xl text-primary">Vows & Veil</Link>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/landing" className="text-muted-foreground hover:text-primary">Home</Link>
            <Link to="/about" className="text-muted-foreground hover:text-primary">About</Link>
            <Link to="/contact" className="text-foreground font-medium">Contact</Link>
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="py-16 lg:py-20">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-xs tracking-[0.2em] uppercase text-primary font-medium mb-4">
            We'd love to hear from you
          </p>
          <h1 className="serif-heading text-4xl lg:text-5xl text-foreground mb-4 leading-tight">
            Contact us
          </h1>
          <p className="text-lg text-muted-foreground mb-10">
            Questions about Vows & Veil, feedback, or need a hand with your wedding
            planning? Send us a message and we'll get back to you.
          </p>

          {sent ? (
            <div className="elegant-card p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-7 h-7 text-primary" />
              </div>
              <h2 className="serif-heading text-2xl mb-2">Message sent</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Thank you for reaching out — we'll respond as soon as we can.
              </p>
              <Button asChild variant="outline">
                <Link to="/landing">Back to home</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="elegant-card p-7 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  className="min-h-[140px] resize-none"
                  required
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><MessageCircle className="w-4 h-4 mr-2" />Send message</>
                )}
              </Button>
            </form>
          )}
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
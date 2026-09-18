import { Link } from 'react-router-dom';
import { Check, Heart } from 'lucide-react';
import StripeBadge from '@/components/StripeBadge';

export default function ThankYou() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">Thank you</p>
        <h1 className="serif-heading text-4xl text-foreground mb-4">Your purchase is complete</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Your planning tier is now unlocked. Head to your dashboard to start planning your special day.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Go to dashboard
        </Link>
        <div className="mt-8">
          <StripeBadge />
        </div>
        <p className="mt-6 text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
          Made with <Heart className="w-3 h-3 text-primary" /> on Vows & Veil
        </p>
      </div>
    </div>
  );
}
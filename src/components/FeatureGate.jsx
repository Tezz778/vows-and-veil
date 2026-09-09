import { Link } from 'react-router-dom';
import { Lock, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeatureGate({ tierLabel }) {
  return (
    <div className="elegant-card p-10 text-center max-w-md mx-auto mt-8">
      <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-5">
        <Lock className="w-6 h-6 text-accent-foreground" />
      </div>
      <h3 className="serif-heading text-2xl text-foreground mb-2">A higher tier unlocks this</h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-6">
        This feature is part of the {tierLabel} experience. Upgrade your plan to unlock it for your celebration.
      </p>
      <Button asChild className="bg-primary hover:bg-primary/90">
        <Link to="/pricing"><Gem className="w-4 h-4 mr-2" /> View plans</Link>
      </Button>
    </div>
  );
}
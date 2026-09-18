import { Link } from 'react-router-dom';
import { Lock, Gem, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FEATURE_INFO } from '@/lib/wedding';
import StripeBadge from '@/components/StripeBadge';

export default function FeatureGate({ tierLabel, feature }) {
  const info = feature ? FEATURE_INFO[feature] : null;

  if (info) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="elegant-card overflow-hidden">
          <div className="bg-gradient-to-br from-accent/50 to-secondary/30 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h3 className="serif-heading text-3xl text-foreground mb-2">{info.title}</h3>
            <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">{info.description}</p>
          </div>
          <div className="p-8">
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {info.points.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{point}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {tierLabel ? `This feature is part of the ${tierLabel} plan.` : 'Upgrade your plan to unlock this feature.'}
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/pricing"><Gem className="w-4 h-4 mr-2" /> View plans</Link>
              </Button>
              <div className="mt-4">
                <StripeBadge />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="mt-5">
        <StripeBadge />
      </div>
    </div>
  );
}
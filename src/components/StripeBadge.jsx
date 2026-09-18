import { Lock } from 'lucide-react';

export default function StripeBadge({ className = '', showText = true }) {
  return (
    <p className={`text-xs text-muted-foreground flex items-center justify-center gap-1.5 ${className}`}>
      <Lock className="w-3 h-3 shrink-0" />
      {showText && <>Secure checkout powered by <span className="font-medium text-foreground">Stripe</span></>}
    </p>
  );
}
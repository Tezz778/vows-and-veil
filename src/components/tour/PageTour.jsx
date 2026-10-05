import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

export default function PageTour({ tourKey, steps, onComplete }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tipPos, setTipPos] = useState(null);

  const current = steps[step];

  useEffect(() => {
    if (!current) return;
    const compute = () => {
      const el = document.querySelector(current.target);
      const TW = 320;
      const TH = 170;
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        const placement = current.placement || 'bottom';
        let pos = { top: 0, left: 0 };
        if (placement === 'bottom') {
          pos.top = rect.bottom + 14;
          pos.left = rect.left + rect.width / 2 - TW / 2;
        } else if (placement === 'top') {
          pos.top = rect.top - TH - 14;
          pos.left = rect.left + rect.width / 2 - TW / 2;
        } else if (placement === 'right') {
          pos.top = rect.top + rect.height / 2 - TH / 2;
          pos.left = rect.right + 14;
        } else {
          pos.top = rect.top + rect.height / 2 - TH / 2;
          pos.left = rect.left - TW - 14;
        }
        pos.left = Math.max(16, Math.min(pos.left, window.innerWidth - TW - 16));
        pos.top = Math.max(16, Math.min(pos.top, window.innerHeight - TH - 16));
        setTipPos(pos);
      } else {
        setTargetRect(null);
        setTipPos({ top: window.innerHeight / 2 - TH / 2, left: window.innerWidth / 2 - TW / 2 });
      }
    };
    const timer = setTimeout(compute, 100);
    window.addEventListener('resize', compute);
    return () => { clearTimeout(timer); window.removeEventListener('resize', compute); };
  }, [step, current]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') complete(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!current) return null;

  const next = () => (step < steps.length - 1 ? setStep(step + 1) : complete());
  const prev = () => step > 0 && setStep(step - 1);
  const complete = () => {
    try { localStorage.setItem(`everbind_tour_${tourKey}`, '1'); } catch {}
    onComplete?.();
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {targetRect ? (
        <div className="absolute pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - 5, left: targetRect.left - 5,
            width: targetRect.width + 10, height: targetRect.height + 10,
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            border: '2px solid hsl(var(--primary))',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55" />
      )}

      {tipPos && (
        <div className="absolute bg-background rounded-xl shadow-2xl border border-border p-5 w-80 transition-all duration-300"
          style={{ top: tipPos.top, left: tipPos.left }}>
          <button onClick={complete} aria-label="Close tour" className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
          <p className="text-[10px] tracking-[0.2em] uppercase text-primary mb-1.5">Step {step + 1} of {steps.length}</p>
          <h3 className="serif-heading text-lg text-foreground mb-1.5 pr-6">{current.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{current.body}</p>
          <div className="flex items-center justify-between">
            {step > 0 ? (
              <Button size="sm" variant="ghost" onClick={prev}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={complete}>Skip</Button>
              <Button size="sm" onClick={next} className="bg-primary hover:bg-primary/90">
                {step < steps.length - 1 ? 'Next' : 'Got it'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
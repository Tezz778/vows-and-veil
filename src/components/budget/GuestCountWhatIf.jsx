import { useState, useMemo } from 'react';
import { Users, TrendingUp, DollarSign } from 'lucide-react';

export default function GuestCountWhatIf({ items, wedding }) {
  const defaultCount = wedding?.guest_count || 50;
  const [count, setCount] = useState(defaultCount);

  const { perGuestTotal, fixedTotal, perGuestItems } = useMemo(() => {
    const perGuest = [];
    let perGuestSum = 0;
    let fixedSum = 0;
    items.forEach((it) => {
      const pg = Number(it.per_guest_amount) || 0;
      const actual = Number(it.actual_amount) || 0;
      if (pg > 0) {
        perGuest.push({ ...it, per_guest_amount: pg });
        perGuestSum += pg;
      } else {
        fixedSum += actual;
      }
    });
    return { perGuestTotal: perGuestSum, fixedTotal: fixedSum, perGuestItems: perGuest };
  }, [items]);

  const scenarioTotal = perGuestTotal * count + fixedTotal;

  const delta = count - defaultCount;
  const deltaCost = perGuestTotal * delta;

  return (
    <div className="elegant-card p-5">
      <h3 className="serif-heading text-lg text-foreground mb-1 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" /> Guest count what-if
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        Adjust your guest count to see how per-guest costs (catering, favors, etc.) impact your total.
      </p>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1">
            <Label className="text-sm font-medium text-foreground">Guest count</Label>
            <span className="serif-heading text-3xl text-primary leading-none">{count}</span>
          </div>
          <input
            type="range"
            min="0"
            max="300"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-[hsl(var(--primary))] mt-2"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span>
            <span>150</span>
            <span>300</span>
          </div>
        </div>
      </div>

      {perGuestItems.length === 0 ? (
        <div className="text-center py-6 bg-secondary/30 rounded-xl">
          <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No per-guest items yet. Set a per-guest amount on budget items like catering or favors to see scenarios.
          </p>
        </div>
      ) : (
        <>
          {/* Per-guest items breakdown */}
          <div className="space-y-2 mb-5">
            {perGuestItems.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{it.category}</span>
                <span className="font-medium text-foreground">
                  ${it.per_guest_amount.toLocaleString()} × {count} = ${(it.per_guest_amount * count).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="soft-divider mb-4" />

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary/40 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Per-guest subtotal</p>
              <p className="serif-heading text-xl text-foreground mt-0.5">
                ${(perGuestTotal * count).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-secondary/40 p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Fixed costs</p>
              <p className="serif-heading text-xl text-foreground mt-0.5">${fixedTotal.toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mt-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Estimated total</p>
              <p className="serif-heading text-2xl text-primary">${scenarioTotal.toLocaleString()}</p>
            </div>
            {delta !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {delta > 0 ? `+${delta} guests` : `${delta} guests`} vs. your current count of {defaultCount}:{' '}
                <span className={delta > 0 ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium'}>
                  {delta > 0 ? '+' : ''}{deltaCost.toLocaleString()}
                </span>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Label({ children, className }) {
  return <label className={className}>{children}</label>;
}
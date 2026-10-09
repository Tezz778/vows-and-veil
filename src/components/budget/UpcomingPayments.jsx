import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { daysUntil, formatDate } from '@/lib/wedding';
import { Calendar, AlertCircle, Check, DollarSign } from 'lucide-react';

export default function UpcomingPayments({ items }) {
  const upcoming = useMemo(() => {
    return items
      .map((it) => {
        const actual = Number(it.actual_amount) || 0;
        const paid = Number(it.paid_amount) || 0;
        const balance = actual - paid;
        return { ...it, balance, actual, paid };
      })
      .filter((it) => it.balance > 0.01 && it.due_date)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }, [items]);

  if (upcoming.length === 0) {
    return (
      <div className="elegant-card p-5">
        <h3 className="serif-heading text-lg text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Upcoming payments
        </h3>
        <div className="text-center py-6">
          <Check className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No outstanding payments. You're all settled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="elegant-card p-5">
      <h3 className="serif-heading text-lg text-foreground mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" /> Upcoming payments
      </h3>
      <div className="space-y-2">
        {upcoming.map((it) => {
          const d = daysUntil(it.due_date);
          const overdue = d !== null && d < 0;
          const soon = d !== null && d >= 0 && d <= 7;
          return (
            <div key={it.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  overdue ? 'bg-rose-100 text-rose-600' : soon ? 'bg-amber-100 text-amber-600' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {overdue ? <AlertCircle className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{it.category}</p>
                {it.vendor_name && <p className="text-xs text-muted-foreground truncate">{it.vendor_name}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {d !== null
                    ? overdue
                      ? `${Math.abs(d)} days overdue`
                      : d === 0
                      ? 'Due today'
                      : `Due in ${d} days`
                    : formatDate(it.due_date)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="serif-heading text-lg text-foreground">${it.balance.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
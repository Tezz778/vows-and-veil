import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { base44 } from '@/api/base44Client';
import { DollarSign } from 'lucide-react';

const currency = (v) => `$${Number(v || 0).toLocaleString()}`;

export default function BudgetChart({ wedding }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wedding) return;
    (async () => {
      try {
        const list = await base44.entities.BudgetItem.filter({ wedding_id: wedding.id }, 'category', 200);
        setItems(list || []);
      } catch {} finally { setLoading(false); }
    })();
  }, [wedding]);

  const data = useMemo(() => {
    const map = {};
    for (const it of items) {
      const cat = it.category || 'Uncategorized';
      if (!map[cat]) map[cat] = { category: cat, Estimated: 0, Actual: 0 };
      map[cat].Estimated += Number(it.estimated_amount) || 0;
      map[cat].Actual += Number(it.actual_amount) || 0;
    }
    return Object.values(map).sort((a, b) => b.Estimated + b.Actual - a.Estimated - a.Actual);
  }, [items]);

  const totals = useMemo(() => ({
    est: data.reduce((s, d) => s + d.Estimated, 0),
    actual: data.reduce((s, d) => s + d.Actual, 0),
  }), [data]);

  return (
    <div className="elegant-card p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="serif-heading text-xl text-foreground">Budget vs. Actual</h2>
        <Link to="/budget" className="text-xs text-primary hover:underline">Manage →</Link>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Estimated budget compared with actual spending, by vendor category.
      </p>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="w-9 h-9 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No budget items yet.</p>
          <Link to="/budget" className="text-xs text-primary hover:underline mt-1 inline-block">
            Add your first category →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-5 mb-4 text-sm">
            <div>
              <span className="text-muted-foreground">Estimated </span>
              <span className="font-medium text-foreground">{currency(totals.est)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Actual </span>
              <span className="font-medium text-primary">{currency(totals.actual)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Difference </span>
              <span className={`font-medium ${totals.actual > totals.est ? 'text-destructive' : 'text-emerald-600'}`}>
                {currency(totals.est - totals.actual)}
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={56}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v) => currency(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--popover))',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Estimated" fill="hsl(var(--primary))" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="hsl(var(--primary))" fillOpacity={1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
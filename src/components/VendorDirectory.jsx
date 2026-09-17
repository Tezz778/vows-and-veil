import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Briefcase, ChevronRight, Check, Clock, AlertCircle, DollarSign, ListChecks } from 'lucide-react';
import { daysUntil } from '@/lib/wedding';

const STATUSES = ['not_contacted', 'contacted', 'contract_signed', 'deposit_paid', 'confirmed', 'cancelled'];
const STATUS_TONE = {
  not_contacted: 'bg-secondary text-muted-foreground',
  contacted: 'bg-amber-100 text-amber-700',
  contract_signed: 'bg-sky-100 text-sky-700',
  deposit_paid: 'bg-violet-100 text-violet-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

const money = (n) => (Number(n || 0)).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function VendorDirectory() {
  const { wedding } = useOutletContext();
  const [vendors, setVendors] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const [v, b, t] = await Promise.all([
        base44.entities.Vendor.filter({ wedding_id: wedding.id }, '-created_date', 200),
        base44.entities.BudgetItem.filter({ wedding_id: wedding.id }, '-created_date', 200),
        base44.entities.ReminderTask.filter({ wedding_id: wedding.id }, 'due_date', 200),
      ]);
      setVendors(v || []);
      setBudgetItems(b || []);
      setTasks(t || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [wedding]);

  if (!wedding) return null;

  const vendorTasks = (v) => (tasks || []).filter((t) => t.vendor_name && t.vendor_name.toLowerCase() === v.name.toLowerCase());
  const vendorBudget = (v) => (budgetItems || []).filter((b) => b.vendor_name && b.vendor_name.toLowerCase() === v.name.toLowerCase());

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="serif-heading text-xl text-foreground">Vendor directory</h2>
        <span className="text-xs text-muted-foreground">{vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'}</span>
      </div>

      {loading ? (
        <div className="elegant-card p-8 text-center text-sm text-muted-foreground">Loading vendors…</div>
      ) : vendors.length === 0 ? (
        <div className="elegant-card p-8 text-center">
          <Briefcase className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No vendors saved yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Add vendors from the Vendors page to see them here.</p>
        </div>
      ) : (
        <div className="elegant-card divide-y divide-border/50">
          {vendors.map((v) => {
            const vTasks = vendorTasks(v);
            const vBudget = vendorBudget(v);
            const budgetTotal = vBudget.reduce((s, b) => s + Number(b.estimated_amount || 0), 0);
            const budgetPaid = vBudget.reduce((s, b) => s + Number(b.paid_amount || 0), 0);
            const pendingTasks = vTasks.filter((t) => !t.done).length;
            return (
              <button key={v.id} onClick={() => setSelected(v)}
                className="w-full flex items-center gap-4 p-4 hover:bg-accent/40 transition-colors text-left">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{v.name}</p>
                    <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full ${STATUS_TONE[v.booking_status] || ''}`}>
                      {v.booking_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{v.category.replace(/_/g, ' ')}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ListChecks className="w-3.5 h-3.5" />
                    {pendingTasks} {pendingTasks === 1 ? 'task' : 'tasks'}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    {money(budgetTotal)}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      <VendorDetailDialog
        vendor={selected}
        onOpenChange={(o) => !o && setSelected(null)}
        tasks={selected ? vendorTasks(selected) : []}
        budgetItems={selected ? vendorBudget(selected) : []}
      />
    </div>
  );
}

function VendorDetailDialog({ vendor, onOpenChange, tasks, budgetItems }) {
  if (!vendor) return null;
  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const estTotal = budgetItems.reduce((s, b) => s + Number(b.estimated_amount || 0), 0);
  const actualTotal = budgetItems.reduce((s, b) => s + Number(b.actual_amount || 0), 0);
  const paidTotal = budgetItems.reduce((s, b) => s + Number(b.paid_amount || 0), 0);
  const owed = actualTotal - paidTotal;

  const urgency = (d) => {
    const days = daysUntil(d);
    if (days === null) return { tone: 'text-muted-foreground', label: 'No date' };
    if (days < 0) return { tone: 'text-rose-600', label: `${Math.abs(days)} days overdue` };
    if (days === 0) return { tone: 'text-amber-600', label: 'Today' };
    return { tone: 'text-muted-foreground', label: `in ${days} days` };
  };

  return (
    <Dialog open={!!vendor} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="serif-heading text-2xl">{vendor.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Vendor info */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full ${STATUS_TONE[vendor.booking_status] || ''}`}>
              {vendor.booking_status.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{vendor.category.replace(/_/g, ' ')}</span>
          </div>
          {(vendor.contact_name || vendor.contact_info) && (
            <div className="text-sm space-y-0.5">
              {vendor.contact_name && <p className="text-foreground">{vendor.contact_name}</p>}
              {vendor.contact_info && <p className="text-muted-foreground">{vendor.contact_info}</p>}
            </div>
          )}

          {/* Budget status */}
          <div>
            <p className="text-xs font-medium text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Budget status
            </p>
            {budgetItems.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No budget items linked to this vendor.</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium text-right">Est.</th>
                      <th className="px-3 py-2 font-medium text-right">Actual</th>
                      <th className="px-3 py-2 font-medium text-right">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {budgetItems.map((b) => (
                      <tr key={b.id}>
                        <td className="px-3 py-2 text-foreground">{b.category}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{money(b.estimated_amount)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{money(b.actual_amount)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{money(b.paid_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-secondary/30 border-t border-border">
                    <tr className="text-xs font-medium">
                      <td className="px-3 py-2 text-foreground">Totals</td>
                      <td className="px-3 py-2 text-right text-foreground">{money(estTotal)}</td>
                      <td className="px-3 py-2 text-right text-foreground">{money(actualTotal)}</td>
                      <td className="px-3 py-2 text-right text-foreground">{money(paidTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            {owed > 0 && (
              <p className="text-xs text-amber-600 mt-2">{money(owed)} still owed</p>
            )}
          </div>

          {/* Assigned tasks */}
          <div>
            <p className="text-xs font-medium text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5" /> Assigned tasks ({tasks.length})
            </p>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No tasks assigned to this vendor.</p>
            ) : (
              <div className="space-y-1.5">
                {pending.map((t) => {
                  const u = urgency(t.due_date);
                  const overdue = daysUntil(t.due_date) !== null && daysUntil(t.due_date) < 0;
                  return (
                    <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/30">
                      <div className="w-4 h-4 rounded border-2 border-border shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{t.title}</p>
                        <p className={`text-xs flex items-center gap-1 ${u.tone}`}>
                          {overdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {t.due_date ? `${new Date(t.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${u.label}` : u.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {done.map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/30 opacity-60">
                    <div className="w-4 h-4 rounded bg-primary border-2 border-primary flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                    <span className="text-sm line-through text-muted-foreground">{t.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
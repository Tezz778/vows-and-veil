import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ActionSheet from '@/components/ui/action-sheet';
import { Plus, Trash2, UserPlus, Check, Clock, Users } from 'lucide-react';

const ROLES = [
  { value: 'partner', label: 'Partner' },
  { value: 'parent', label: 'Parent' },
  { value: 'planner', label: 'Planner' },
  { value: 'other', label: 'Other' },
];

const ROLE_LABELS = { partner: 'Partner', parent: 'Parent', planner: 'Planner', other: 'Team Member' };

export default function Team() {
  const { wedding } = useOutletContext();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('partner');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!wedding) return;
    setLoading(true);
    try {
      const list = await base44.entities.TeamMember.filter({ wedding_id: wedding.id }, 'created_date', 100);
      setMembers(list || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (!wedding) return;
    base44.functions.invoke('accept-team-invite', {}).then(() => load()).catch(() => load());
  }, [wedding]);

  if (!wedding) return null;

  const invite = async () => {
    if (!email.trim()) return;
    setSaving(true);
    try {
      await base44.entities.TeamMember.create({
        wedding_id: wedding.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        status: 'pending',
      });
      setDialogOpen(false);
      setEmail('');
      setName('');
      setRole('partner');
      load();
    } catch (e) {
      alert('Could not invite: ' + (e.message || 'error'));
    } finally { setSaving(false); }
  };

  const removeMember = async (member) => {
    await base44.entities.TeamMember.delete(member.id);
    load();
  };

  const accepted = members.filter((m) => m.status === 'accepted');
  const pending = members.filter((m) => m.status === 'pending');

  return (
    <div>
      <PageHeader
        eyebrow="Collaboration"
        title="Wedding Team"
        subtitle="Invite your partner, parents, or planner so everyone works from the same source of truth."
      >
        <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-1" /> Invite
        </Button>
      </PageHeader>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading team…</div>
      ) : members.length === 0 ? (
        <div className="elegant-card p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="serif-heading text-xl text-foreground">No team members yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Invite your partner or planner to collaborate on this wedding.
          </p>
          <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <UserPlus className="w-4 h-4 mr-1" /> Invite your first member
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {accepted.length > 0 && (
            <div>
              <h3 className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground/70 mb-3">Active</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {accepted.map((m) => (
                  <MemberCard key={m.id} member={m} onRemove={removeMember} />
                ))}
              </div>
            </div>
          )}
          {pending.length > 0 && (
            <div>
              <h3 className="text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground/70 mb-3">Pending</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pending.map((m) => (
                  <MemberCard key={m.id} member={m} onRemove={removeMember} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="serif-heading text-2xl">Invite team member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="ie">Email address</Label>
              <Input id="ie" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="in">Name (optional)</Label>
              <Input id="in" placeholder="Their name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="ir">Role</Label>
              <ActionSheet id="ir" value={role} onChange={setRole} options={ROLES} className="mt-1.5" />
            </div>
            <p className="text-xs text-muted-foreground">
              They'll get access to this wedding's guest list, timeline, budget, and more once they sign in.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={invite} disabled={saving || !email.trim()} className="bg-primary hover:bg-primary/90">
              {saving ? 'Sending…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MemberCard({ member, onRemove }) {
  const isPending = member.status === 'pending';
  return (
    <div className="elegant-card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
        {isPending ? <Clock className="w-5 h-5" /> : <Check className="w-5 h-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground truncate">{member.name || member.email}</p>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        <span className="inline-block mt-1 text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
          {ROLE_LABELS[member.role] || 'Team Member'}
        </span>
      </div>
      <button
        onClick={() => onRemove(member)}
        aria-label={`Remove ${member.name || member.email}`}
        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
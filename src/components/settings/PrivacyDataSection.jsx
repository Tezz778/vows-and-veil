import { useOutletContext } from 'react-router-dom';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import SettingsSection from './SettingsSection';

export default function PrivacyDataSection() {
  const { wedding } = useOutletContext();
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const exportData = async () => {
    setExporting(true);
    try {
      const [timeline, guests, budget, reminders] = await Promise.all([
        base44.entities.TimelineEvent.filter({ wedding_id: wedding.id }, '-order', 500),
        base44.entities.Guest.filter({ wedding_id: wedding.id }, '-created_date', 500),
        base44.entities.BudgetItem.filter({ wedding_id: wedding.id }, '-created_date', 500),
        base44.entities.ReminderTask.filter({ wedding_id: wedding.id }, '-created_date', 500),
      ]);
      const data = { wedding, timeline, guests, budget, reminders, exported_at: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vows-veil-export-${(wedding.couple_names || 'wedding').replace(/\s+/g, '-').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not export data: ' + (err.message || 'error'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <SettingsSection icon={AlertTriangle} title="Privacy & Data" description="Export or delete your account data.">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <p className="text-sm font-medium text-foreground">Export your data</p>
            <p className="text-xs text-muted-foreground mt-0.5">Download a JSON file with your wedding, timeline, guests, budget, and reminders.</p>
          </div>
          <Button onClick={exportData} disabled={exporting} variant="outline" size="sm" className="shrink-0">
            <Download className="w-4 h-4 mr-1.5" /> {exporting ? 'Exporting…' : 'Export'}
          </Button>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="pr-4">
            <p className="text-sm font-medium text-destructive">Delete account</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently remove your wedding and all associated data.</p>
          </div>
          <Button onClick={() => setDeleteOpen(true)} variant="destructive" size="sm" className="shrink-0">
            <Trash2 className="w-4 h-4 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setConfirmText(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="serif-heading text-2xl text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Delete account?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete your wedding, timeline, guests, budget, and all other data. This action cannot be undone.
          </p>
          <p className="text-sm text-muted-foreground">
            Type <span className="font-medium text-foreground">DELETE</span> to confirm.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="DELETE"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setDeleteOpen(false); setConfirmText(''); }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={confirmText !== 'DELETE'}
              onClick={async () => {
                try {
                  await base44.entities.Wedding.delete(wedding.id);
                  await base44.auth.logout();
                  window.location.href = '/login';
                } catch (err) {
                  alert('Could not delete: ' + (err.message || 'error'));
                }
              }}
            >
              Delete everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsSection>
  );
}
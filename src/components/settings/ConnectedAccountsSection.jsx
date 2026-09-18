import { Mail, CheckCircle2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SettingsSection from './SettingsSection';

export default function ConnectedAccountsSection() {
  return (
    <SettingsSection icon={Mail} title="Connected Accounts" description="Manage third-party service connections.">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
            <Mail className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Gmail</p>
            <p className="text-xs text-muted-foreground">Used for sending emails to your guests.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Available
          </span>
          <Button asChild variant="outline" size="sm">
            <a href="/email"><Link2 className="w-3.5 h-3.5 mr-1" /> Manage</a>
          </Button>
        </div>
      </div>
    </SettingsSection>
  );
}
import { Shield, Mail, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import SettingsSection from './SettingsSection';

export default function AccountSecuritySection() {
  const { user } = useAuth();

  return (
    <SettingsSection icon={Shield} title="Account & Security" description="Manage your email and password.">
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email address</p>
          <p className="text-sm font-medium text-foreground">{user?.email || '—'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/forgot-password"><KeyRound className="w-4 h-4 mr-1.5" /> Change password</a>
          </Button>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-border/50">
          <div className="pr-4">
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Two-factor authentication
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security to your account.</p>
          </div>
          <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-accent">Coming soon</span>
        </div>
      </div>
    </SettingsSection>
  );
}
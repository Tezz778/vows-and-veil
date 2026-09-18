import { Bell } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import SettingsSection from './SettingsSection';
import { saveWeddingSetting } from '@/lib/settings';

const TOGGLES = [
  { key: 'notif_email_reminders', label: 'Email reminders', desc: 'Receive task and due-date reminders by email.' },
  { key: 'notif_countdown_alerts', label: 'Countdown alerts', desc: 'Get notified at key milestones before your wedding.' },
  { key: 'notif_rsvp_activity', label: 'RSVP & guest activity', desc: 'Be alerted when guests RSVP or update their details.' },
];

export default function NotificationsSection() {
  const { wedding, setWedding } = useOutletContext();

  return (
    <SettingsSection icon={Bell} title="Notifications" description="Choose what we alert you about.">
      <div className="space-y-1">
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
            <div className="pr-4">
              <p className="text-sm font-medium text-foreground">{t.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
            </div>
            <Switch
              checked={wedding?.[t.key] !== false}
              onCheckedChange={(checked) => saveWeddingSetting(wedding, setWedding, t.key, checked)}
            />
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
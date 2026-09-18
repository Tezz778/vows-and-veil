import { Sun, Moon, Monitor } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import SettingsSection from './SettingsSection';
import { saveWeddingSetting } from '@/lib/settings';
import { setThemePreference, getThemePreference } from '@/lib/theme';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function AppearanceSection() {
  const { wedding, setWedding } = useOutletContext();
  const current = wedding?.theme_preference || getThemePreference();

  const handleChange = (value) => {
    setThemePreference(value);
    saveWeddingSetting(wedding, setWedding, 'theme_preference', value);
  };

  return (
    <SettingsSection icon={Sun} title="Appearance" description="Choose how Vows & Veil looks.">
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = current === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleChange(opt.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
                active
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}
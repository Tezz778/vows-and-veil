import PageHeader from '@/components/PageHeader';
import AppearanceSection from '@/components/settings/AppearanceSection';
import TimeZoneSection from '@/components/settings/TimeZoneSection';
import TimeFormatSection from '@/components/settings/TimeFormatSection';
import NotificationsSection from '@/components/settings/NotificationsSection';
import AccountSecuritySection from '@/components/settings/AccountSecuritySection';
import ConnectedAccountsSection from '@/components/settings/ConnectedAccountsSection';
import PrivacyDataSection from '@/components/settings/PrivacyDataSection';

export default function Settings() {
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Account" title="Settings" subtitle="Manage your preferences, account, and data." />
      <div className="space-y-5">
        <AppearanceSection />
        <TimeZoneSection />
        <TimeFormatSection />
        <NotificationsSection />
        <AccountSecuritySection />
        <ConnectedAccountsSection />
        <PrivacyDataSection />
      </div>
    </div>
  );
}
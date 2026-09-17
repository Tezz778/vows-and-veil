import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/PageHeader';
import { Mail, Loader2, Check, Unlink, Send, Users } from 'lucide-react';

const CONNECTOR_ID = '6aac3e7dda961b837ebe5200';

export default function GmailCompose() {
  const { wedding } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [guests, setGuests] = useState([]);

  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const checkStatus = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('send-gmail', { action: 'status' });
      const data = res?.data ?? res;
      if (data?.connected) {
        setConnected(true);
        setEmailAddress(data.emailAddress || '');
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await checkStatus();
      if (wedding) {
        try {
          const list = await base44.entities.Guest.filter({ wedding_id: wedding.id }, 'name', 500);
          setGuests(list || []);
        } catch {}
      }
    })();
  }, [wedding, checkStatus]);

  const handleConnect = async () => {
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkStatus();
        }
      }, 500);
    } catch (e) {
      setError(e.message || 'Failed to start Gmail connection');
    }
  };

  const handleDisconnect = async () => {
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setConnected(false);
      setEmailAddress('');
    } catch (e) {
      setError(e.message || 'Failed to disconnect');
    }
  };

  const handleSend = async () => {
    if (!to.trim()) { setError('Please enter a recipient'); return; }
    if (!subject.trim()) { setError('Please enter a subject'); return; }
    setSending(true); setError(''); setSent(false);
    try {
      const res = await base44.functions.invoke('send-gmail', {
        action: 'send',
        to: to.trim(),
        subject: subject.trim(),
        body: body,
      });
      const data = res?.data ?? res;
      if (data?.error) {
        setError(data.error);
      } else {
        setSent(true);
        setTo(''); setSubject(''); setBody('');
      }
    } catch (e) {
      setError(e.message || 'Failed to send email');
    } finally { setSending(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Communication"
        title="Email Guests"
        subtitle="Connect your Gmail account to send emails to guests directly from your own address."
      />

      {!connected ? (
        <div className="elegant-card p-8 sm:p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <h2 className="serif-heading text-2xl text-foreground mb-3">Connect your Gmail</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Link your personal Gmail account to send invitations, updates, and thank-you notes to your guests — all from your own email address.
          </p>
          <Button onClick={handleConnect} className="bg-primary hover:bg-primary/90 h-11 px-6">
            <Mail className="w-4 h-4" /> Connect Gmail
          </Button>
          {error && <p className="text-sm text-destructive mt-4">{error}</p>}
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Connection status */}
          <div className="elegant-card p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Connected to Gmail</p>
                <p className="text-xs text-muted-foreground">{emailAddress}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              <Unlink className="w-3.5 h-3.5" /> Disconnect
            </Button>
          </div>

          {sent && (
            <div className="elegant-card p-5 flex items-center gap-3 bg-emerald-50 border-emerald-200">
              <Check className="w-5 h-5 text-emerald-600" />
              <p className="text-sm text-emerald-800">Email sent successfully from your Gmail account.</p>
            </div>
          )}

          {/* Compose form */}
          <div className="elegant-card p-6 sm:p-8 space-y-5">
            <div>
              <Label htmlFor="gmail-to">To</Label>
              <div className="flex gap-2 mt-1.5">
                <Input id="gmail-to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
              </div>
              {guests.length > 0 && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Quick add:</span>
                  {guests.filter((g) => g.contact && g.contact.includes('@')).slice(0, 6).map((g) => (
                    <button key={g.id} type="button" onClick={() => setTo(g.contact)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-accent transition-colors">
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="gmail-subject">Subject</Label>
              <Input id="gmail-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5" placeholder="Email subject" />
            </div>

            <div>
              <Label htmlFor="gmail-body">Message</Label>
              <Textarea id="gmail-body" value={body} onChange={(e) => setBody(e.target.value)} className="mt-1.5 min-h-[200px]" placeholder="Write your message…" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleSend} disabled={sending} className="bg-primary hover:bg-primary/90 h-11 px-6">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending…' : 'Send Email'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, X, Send, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SafetyButton({ ride }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const sendSafetyEmail = async () => {
    if (!email.trim()) { toast.error('Enter an email address'); return; }
    setSending(true);

    const statusLabel = {
      requested: 'Finding a driver',
      accepted: 'Driver is on the way',
      in_progress: 'Trip in progress',
      completed: 'Trip completed',
    }[ride.status] || ride.status;

    const body = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#0f0a1e;color:#f5f0e8;border-radius:12px;">
        <div style="margin-bottom:20px;">
          <span style="background:#f5c518;color:#0f0a1e;font-weight:700;padding:4px 12px;border-radius:20px;font-size:13px;">🛡️ Dip Out Safety Alert</span>
        </div>
        <h2 style="margin:0 0 6px;font-size:22px;">A rider shared their trip with you</h2>
        <p style="color:#9e94b8;margin:0 0 24px;font-size:14px;">This was sent from the Dip Out app as a safety check-in.</p>

        <div style="background:#1a1030;border-radius:10px;padding:16px 20px;margin-bottom:16px;">
          <p style="margin:0 0 4px;font-size:11px;color:#9e94b8;text-transform:uppercase;letter-spacing:.08em;">Current Status</p>
          <p style="margin:0;font-size:16px;font-weight:600;">${statusLabel}</p>
        </div>

        <div style="background:#1a1030;border-radius:10px;padding:16px 20px;margin-bottom:16px;">
          <p style="margin:0 0 4px;font-size:11px;color:#9e94b8;text-transform:uppercase;letter-spacing:.08em;">Rider</p>
          <p style="margin:0;font-size:15px;">${ride.rider_email}</p>
        </div>

        <div style="background:#1a1030;border-radius:10px;padding:16px 20px;margin-bottom:16px;">
          <p style="margin:0 0 8px;font-size:11px;color:#9e94b8;text-transform:uppercase;letter-spacing:.08em;">Trip Route</p>
          <p style="margin:0 0 4px;font-size:14px;"><span style="color:#9e94b8;">From:</span> ${ride.pickup_address}</p>
          <p style="margin:0;font-size:14px;"><span style="color:#9e94b8;">To:</span> ${ride.dropoff_address}</p>
        </div>

        ${ride.driver_email ? `
        <div style="background:#1a1030;border-radius:10px;padding:16px 20px;margin-bottom:16px;">
          <p style="margin:0 0 4px;font-size:11px;color:#9e94b8;text-transform:uppercase;letter-spacing:.08em;">Driver</p>
          <p style="margin:0;font-size:15px;">${ride.driver_email}</p>
        </div>` : ''}

        <p style="color:#9e94b8;font-size:12px;margin-top:24px;">Sent at ${new Date().toLocaleString()} via Dip Out Safety Feature.</p>
      </div>
    `;

    await base44.integrations.Core.SendEmail({
      to: email.trim(),
      subject: `🛡️ Safety check-in from Dip Out — ${ride.rider_email} is on a trip`,
      body,
    });

    setSent(true);
    setSending(false);
    toast.success('Safety info sent!');
    setTimeout(() => { setOpen(false); setSent(false); setEmail(''); }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border border-destructive/40 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors"
      >
        <Shield className="w-4 h-4" /> Share trip for safety
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-base">Safety share</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Send your current ride details — status, route, and driver info — to an emergency contact.
            </p>

            <div className="rounded-xl border border-border bg-secondary/50 p-3 text-xs space-y-1 text-muted-foreground">
              <p><span className="text-foreground font-medium">Route:</span> {ride.pickup_address} → {ride.dropoff_address}</p>
              {ride.driver_email && <p><span className="text-foreground font-medium">Driver:</span> {ride.driver_email}</p>}
            </div>

            <Input
              type="email"
              placeholder="Emergency contact email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendSafetyEmail()}
            />

            <Button
              onClick={sendSafetyEmail}
              disabled={sending || sent || !email.trim()}
              className="w-full h-11 rounded-xl font-semibold"
            >
              {sent ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Sent!</>
              ) : sending ? (
                'Sending…'
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send safety info</>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
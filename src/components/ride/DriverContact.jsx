import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Phone } from 'lucide-react';

export default function DriverContact({ driverEmail }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!driverEmail) return;
    base44.entities.DriverProfile.filter({ user_email: driverEmail }).then((r) => r.length && setProfile(r[0]));
  }, [driverEmail]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-sm flex items-center justify-between">
      <div>
        <p className="text-muted-foreground text-xs mb-0.5">Your driver</p>
        <p className="font-medium">{driverEmail}</p>
        {profile?.vehicle && <p className="text-xs text-muted-foreground mt-0.5">{profile.vehicle} · {profile.plate}</p>}
      </div>
      {profile?.phone && (
        <a
          href={`tel:${profile.phone}`}
          className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
          title={`Call ${profile.phone}`}
        >
          <Phone className="w-4 h-4 text-primary" />
        </a>
      )}
    </div>
  );
}
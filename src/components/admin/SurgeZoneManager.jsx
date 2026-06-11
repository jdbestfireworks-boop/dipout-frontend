import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Zap } from 'lucide-react';

export default function SurgeZoneManager() {
  const qc = useQueryClient();
  const { data: zones = [] } = useQuery({
    queryKey: ['surge-zones'],
    queryFn: () => base44.entities.SurgeZone.list(),
    refetchInterval: 15000,
  });

  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', lat: '', lng: '', radius_km: '2', surge_multiplier: '1.5' });

  const save = async () => {
    setSaving(true);
    await base44.entities.SurgeZone.create({
      name: form.name,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      radius_km: parseFloat(form.radius_km),
      surge_multiplier: parseFloat(form.surge_multiplier),
      active: true,
    });
    qc.invalidateQueries({ queryKey: ['surge-zones'] });
    setForm({ name: '', lat: '', lng: '', radius_km: '2', surge_multiplier: '1.5' });
    setAdding(false);
    setSaving(false);
  };

  const toggle = async (zone) => {
    await base44.entities.SurgeZone.update(zone.id, { active: !zone.active });
    qc.invalidateQueries({ queryKey: ['surge-zones'] });
  };

  const remove = async (id) => {
    await base44.entities.SurgeZone.delete(id);
    qc.invalidateQueries({ queryKey: ['surge-zones'] });
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="font-semibold">Surge Zones</span>
          <span className="text-xs text-muted-foreground">{zones.filter(z => z.active).length} active</span>
        </div>
        <Button size="sm" onClick={() => setAdding((v) => !v)} variant="outline" className="h-8 rounded-xl">
          <Plus className="w-3.5 h-3.5" /> Add zone
        </Button>
      </div>

      {adding && (
        <div className="p-4 border-b border-border bg-accent/20 grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Zone name</p>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Downtown, Airport" className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Latitude</p>
            <Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })}
              placeholder="40.7128" type="number" className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Longitude</p>
            <Input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })}
              placeholder="-74.0060" type="number" className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Radius (km)</p>
            <Input value={form.radius_km} onChange={(e) => setForm({ ...form, radius_km: e.target.value })}
              type="number" step="0.5" className="h-9 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Surge multiplier</p>
            <Input value={form.surge_multiplier} onChange={(e) => setForm({ ...form, surge_multiplier: e.target.value })}
              type="number" step="0.1" className="h-9 rounded-xl" />
          </div>
          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdding(false)} className="h-9 rounded-xl">Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving || !form.name || !form.lat || !form.lng} className="h-9 rounded-xl">
              {saving ? 'Saving…' : 'Save zone'}
            </Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {zones.map((z) => (
          <div key={z.id} className="flex items-center justify-between px-4 py-3 gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">{z.name}</p>
                <Badge variant={z.active ? 'default' : 'outline'} className="text-[10px]">
                  {z.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {z.lat?.toFixed(4)}, {z.lng?.toFixed(4)} · {z.radius_km} km radius
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className="font-bold text-sm">{z.surge_multiplier}x</Badge>
              <Button variant="ghost" size="sm" onClick={() => toggle(z)} className="h-8 rounded-xl text-xs px-3">
                {z.active ? 'Disable' : 'Enable'}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(z.id)}
                className="h-8 w-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {zones.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No surge zones defined yet.</p>
        )}
      </div>
    </div>
  );
}
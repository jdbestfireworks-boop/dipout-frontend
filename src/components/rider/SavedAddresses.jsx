import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Home, Briefcase, MapPin, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AddressInput from '@/components/rider/AddressInput';
import { toast } from 'sonner';

const LABEL_META = {
  home: { icon: Home, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  work: { icon: Briefcase, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  other: { icon: MapPin, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export default function SavedAddresses({ onSelect }) {
  const [addresses, setAddresses] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ label: 'home', address: '', lat: null, lng: null });

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      setUserEmail(user.email);
      const saved = await base44.entities.SavedAddress.filter({ user_email: user.email });
      setAddresses(saved);
    })();
  }, []);

  const usedLabels = addresses.filter(a => a.id !== editingId).map(a => a.label);

  const saveAddress = async () => {
    if (!form.address) { toast.error('Enter an address'); return; }
    if (editingId) {
      const updated = await base44.entities.SavedAddress.update(editingId, {
        label: form.label, address: form.address, lat: form.lat, lng: form.lng,
      });
      setAddresses(prev => prev.map(a => a.id === editingId ? updated : a));
      setEditingId(null);
    } else {
      const created = await base44.entities.SavedAddress.create({
        user_email: userEmail, label: form.label, address: form.address,
        lat: form.lat, lng: form.lng,
      });
      setAddresses(prev => [...prev, created]);
      setAdding(false);
    }
    setForm({ label: 'home', address: '', lat: null, lng: null });
  };

  const deleteAddress = async (id) => {
    await base44.entities.SavedAddress.delete(id);
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  const startEdit = (addr) => {
    setEditingId(addr.id);
    setAdding(false);
    setForm({ label: addr.label, address: addr.address, lat: addr.lat, lng: addr.lng });
  };

  const cancelForm = () => {
    setAdding(false);
    setEditingId(null);
    setForm({ label: 'home', address: '', lat: null, lng: null });
  };

  const availableLabels = ['home', 'work', 'other'].filter(l => !usedLabels.includes(l) || l === form.label);

  return (
    <div className="space-y-2">
      {addresses.map((addr) => {
        const { icon: Icon, color, bg } = LABEL_META[addr.label] || LABEL_META.other;
        const isEditing = editingId === addr.id;
        return (
          <div key={addr.id}>
            {isEditing ? (
              <AddressForm
                form={form}
                setForm={setForm}
                availableLabels={availableLabels}
                onSave={saveAddress}
                onCancel={cancelForm}
              />
            ) : (
              <button
                onClick={() => onSelect(addr.address, addr.lat ? { lat: addr.lat, lng: addr.lng } : null)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors group text-left"
              >
                <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold capitalize text-muted-foreground">{addr.label}</p>
                  <p className="text-sm font-medium truncate">{addr.address}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(addr); }} className="p-1.5 rounded-lg hover:bg-secondary">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </button>
            )}
          </div>
        );
      })}

      {adding && (
        <AddressForm
          form={form}
          setForm={setForm}
          availableLabels={availableLabels}
          onSave={saveAddress}
          onCancel={cancelForm}
        />
      )}

      {!adding && !editingId && addresses.length < 3 && (
        <button
          onClick={() => { setAdding(true); setForm({ label: availableLabels[0] || 'other', address: '', lat: null, lng: null }); }}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add saved address
        </button>
      )}
    </div>
  );
}

function AddressForm({ form, setForm, availableLabels, onSave, onCancel }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <div className="flex gap-2">
        {availableLabels.map(l => {
          const { icon: Icon, color } = LABEL_META[l] || LABEL_META.other;
          return (
            <button
              key={l}
              onClick={() => setForm(f => ({ ...f, label: l }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                form.label === l ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${form.label === l ? 'text-primary' : color}`} /> {l}
            </button>
          );
        })}
      </div>
      <AddressInput
        placeholder="Enter address…"
        value={form.address}
        onChange={(val, coords) => setForm(f => ({ ...f, address: val, lat: coords?.lat ?? null, lng: coords?.lng ?? null }))}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} className="flex-1 h-8 text-xs rounded-lg">
          <Check className="w-3.5 h-3.5 mr-1" /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-8 text-xs rounded-lg px-3">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
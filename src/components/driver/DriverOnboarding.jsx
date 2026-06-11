import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Upload, Loader2, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

const STEPS = [
  { num: '01', title: 'About you',     sub: 'Basic personal details' },
  { num: '02', title: 'Your vehicle',  sub: 'Car info & plate number' },
  { num: '03', title: 'Documents',     sub: 'License & insurance upload' },
];

function FileUpload({ label, value, uploading, onChange }) {
  const done = typeof value === 'string';
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{label}</p>
      <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-sm
        ${done ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}
        ${uploading ? 'pointer-events-none opacity-60' : ''}
      `}>
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
        ) : done ? (
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
        ) : (
          <Upload className="w-5 h-5 shrink-0" />
        )}
        <span>{uploading ? 'Uploading…' : done ? 'Uploaded ✓' : 'Tap to upload photo or PDF'}</span>
        <input type="file" accept="image/*,.pdf" className="hidden"
          onChange={(e) => onChange(e.target.files[0] || null)} disabled={uploading} />
      </label>
    </div>
  );
}

export default function DriverOnboarding({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [personal, setPersonal] = useState({ phone: '', dob: '' });
  const [vehicle, setVehicle]   = useState({ make_model: '', year: '', plate: '', color: '' });
  const [license, setLicense]   = useState({ url: null, uploading: false });
  const [insurance, setInsurance] = useState({ url: null, uploading: false });

  const uploadFile = async (file, setter) => {
    setter((prev) => ({ ...prev, uploading: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setter((prev) => ({ ...prev, url: file_url, uploading: false }));
  };

  const canNext = () => {
    if (step === 0) return personal.phone && personal.dob;
    if (step === 1) return vehicle.make_model && vehicle.year && vehicle.plate && vehicle.color;
    if (step === 2) return license.url && insurance.url;
    return false;
  };

  const handleSubmit = async () => {
    setSaving(true);
    const p = await base44.entities.DriverProfile.create({
      user_email: user.email,
      phone: personal.phone,
      vehicle: `${vehicle.make_model} ${vehicle.year}`,
      plate: vehicle.plate,
      license_doc_url: license.url,
      insurance_doc_url: insurance.url,
      status: 'offline',
      rating: 5,
      total_earnings: 0,
      trips_completed: 0,
    });
    onComplete(p);
  };

  const slides = [
    <div key="personal" className="space-y-5">
      <div className="space-y-1">
        <p className="text-4xl font-display font-bold text-primary">01</p>
        <h2 className="text-2xl font-display font-bold">About you</h2>
        <p className="text-sm text-muted-foreground">We just need a couple of quick details.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Full name</p>
          <Input value={user.full_name || ''} disabled className="h-12 rounded-2xl bg-secondary border-0 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Phone number <span className="text-destructive">*</span></p>
          <Input value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
            placeholder="+1 (555) 000-0000" type="tel" className="h-12 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Date of birth <span className="text-destructive">*</span></p>
          <Input value={personal.dob} onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
            type="date" className="h-12 rounded-2xl" />
        </div>
      </div>
    </div>,

    <div key="vehicle" className="space-y-5">
      <div className="space-y-1">
        <p className="text-4xl font-display font-bold text-primary">02</p>
        <h2 className="text-2xl font-display font-bold">Your vehicle</h2>
        <p className="text-sm text-muted-foreground">Tell us the car you'll be driving.</p>
      </div>
      <div className="space-y-4">
        {[
          { label: 'Make & model', key: 'make_model', placeholder: 'e.g. Toyota Prius' },
          { label: 'Year', key: 'year', placeholder: 'e.g. 2022', type: 'number' },
          { label: 'Color', key: 'color', placeholder: 'e.g. Silver' },
          { label: 'License plate', key: 'plate', placeholder: 'e.g. ABC-1234' },
        ].map(({ label, key, placeholder, type }) => (
          <div key={key} className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{label} <span className="text-destructive">*</span></p>
            <Input value={vehicle[key]} onChange={(e) => setVehicle({ ...vehicle, [key]: e.target.value })}
              placeholder={placeholder} type={type || 'text'} className="h-12 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>,

    <div key="docs" className="space-y-5">
      <div className="space-y-1">
        <p className="text-4xl font-display font-bold text-primary">03</p>
        <h2 className="text-2xl font-display font-bold">Documents</h2>
        <p className="text-sm text-muted-foreground">Upload clear photos or PDFs — both are required.</p>
      </div>
      <FileUpload label="Driver's license *" value={license.url} uploading={license.uploading}
        onChange={(f) => { if (f) uploadFile(f, setLicense); }} />
      <FileUpload label="Insurance card *" value={insurance.url} uploading={insurance.uploading}
        onChange={(f) => { if (f) uploadFile(f, setInsurance); }} />
    </div>,
  ];

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-24 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
          <Car className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-display font-bold leading-none">Dip Out</p>
          <p className="text-xs text-muted-foreground">Driver registration</p>
        </div>
      </div>

      {/* Step pills */}
      <div className="flex gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
        ))}
      </div>

      {/* Slide */}
      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>
          {slides[step]}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-background/80 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="h-12 rounded-2xl w-14 flex-shrink-0 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}
              className="h-12 rounded-2xl flex-1 font-semibold text-base">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canNext() || saving || license.uploading || insurance.uploading}
              className="h-12 rounded-2xl flex-1 font-semibold text-base">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <>Start driving <ArrowRight className="w-4 h-4" /></>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
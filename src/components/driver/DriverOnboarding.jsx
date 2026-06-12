import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, Upload, Loader2, CheckCircle2, ArrowRight, ArrowLeft,
  User, FileText, Shield, Smartphone, Calendar, Palette,
  Hash, Star, Clock, ChevronRight
} from 'lucide-react';

// ─── Step definitions ────────────────────────────────────────────
const STEPS = [
  { id: 'welcome',  icon: Star,     title: 'Welcome',        sub: 'Join the Dip Out fleet' },
  { id: 'personal', icon: User,     title: 'About You',      sub: 'Contact details' },
  { id: 'vehicle',  icon: Car,      title: 'Your Vehicle',   sub: 'Car info & plate' },
  { id: 'docs',     icon: FileText, title: 'Documents',      sub: 'License & insurance' },
  { id: 'review',   icon: Shield,   title: 'Review',         sub: 'Confirm & submit' },
];

// ─── File upload widget ──────────────────────────────────────────
function FileUpload({ label, hint, value, uploading, onChange }) {
  const done = typeof value === 'string';
  return (
    <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all select-none
      ${done ? 'border-primary bg-primary/8' : 'border-border hover:border-primary/40 hover:bg-accent/20'}
      ${uploading ? 'pointer-events-none opacity-60' : ''}
    `}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-primary/15' : 'bg-secondary'}`}>
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : done ? (
          <CheckCircle2 className="w-7 h-7 text-primary" />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{uploading ? 'Uploading…' : done ? 'Uploaded ✓' : hint}</p>
      </div>
      {done && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
      <input type="file" accept="image/*,.pdf" className="hidden"
        onChange={(e) => onChange(e.target.files[0] || null)} disabled={uploading} />
    </label>
  );
}

// ─── Field row for review screen ────────────────────────────────
function ReviewRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

// ─── Step progress bar ───────────────────────────────────────────
function StepBar({ current, total }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < current ? 'bg-primary' : i === current ? 'bg-primary/50' : 'bg-secondary'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────
export default function DriverOnboarding({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [personal, setPersonal] = useState({ phone: '', dob: '' });
  const [vehicle, setVehicle] = useState({ make_model: '', year: '', plate: '', color: '' });
  const [license, setLicense] = useState({ url: null, uploading: false });
  const [insurance, setInsurance] = useState({ url: null, uploading: false });

  const uploadFile = async (file, setter) => {
    setter((prev) => ({ ...prev, uploading: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setter((prev) => ({ ...prev, url: file_url, uploading: false }));
  };

  const canNext = () => {
    if (step === 0) return true; // welcome screen
    if (step === 1) return personal.phone.trim() && personal.dob;
    if (step === 2) return vehicle.make_model.trim() && vehicle.year && vehicle.plate.trim() && vehicle.color.trim();
    if (step === 3) return license.url && insurance.url;
    if (step === 4) return true; // review
    return false;
  };

  const handleSubmit = async () => {
    setSaving(true);
    const p = await base44.entities.DriverProfile.create({
      user_email: user.email,
      phone: personal.phone,
      vehicle: `${vehicle.color} ${vehicle.make_model} ${vehicle.year}`,
      plate: vehicle.plate.toUpperCase(),
      license_doc_url: license.url,
      insurance_doc_url: insurance.url,
      status: 'offline',
      rating: 5,
      total_earnings: 0,
      trips_completed: 0,
    });
    onComplete(p);
  };

  // ── Slide content ──────────────────────────────────────────────
  const slides = [
    // STEP 0 — Welcome
    <div key="welcome" className="space-y-8 text-center pt-4">
      <div className="w-24 h-24 rounded-full bg-primary/15 border-4 border-primary/30 flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
        <Car className="w-12 h-12 text-primary" />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-display font-bold">Become a Driver</h2>
        <p className="text-muted-foreground text-base max-w-xs mx-auto">
          Earn on your schedule. Drive when you want, where you want — Louisiana only.
        </p>
      </div>
      <div className="text-left space-y-3 bg-secondary/60 rounded-2xl p-5">
        {[
          { icon: Clock,    text: 'Takes about 3 minutes to apply' },
          { icon: FileText, text: 'License & insurance photo required' },
          { icon: Shield,   text: 'Admin review before you go live' },
          { icon: Star,     text: 'Keep 80% of every fare' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>,

    // STEP 1 — Personal
    <div key="personal" className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-bold text-primary uppercase tracking-widest">Step 1 of 3</p>
        <h2 className="text-2xl font-display font-bold">About You</h2>
        <p className="text-sm text-muted-foreground">We need a few personal details to verify you.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Full Name
          </label>
          <Input value={user.full_name || ''} disabled
            className="h-12 rounded-xl bg-secondary border-0 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> Phone Number <span className="text-destructive">*</span>
          </label>
          <Input
            value={personal.phone}
            onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            type="tel"
            className="h-12 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Date of Birth <span className="text-destructive">*</span>
          </label>
          <Input
            value={personal.dob}
            onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
            type="date"
            className="h-12 rounded-xl"
          />
        </div>
      </div>
    </div>,

    // STEP 2 — Vehicle
    <div key="vehicle" className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-bold text-primary uppercase tracking-widest">Step 2 of 3</p>
        <h2 className="text-2xl font-display font-bold">Your Vehicle</h2>
        <p className="text-sm text-muted-foreground">Tell us the car you'll use for rides.</p>
      </div>
      <div className="space-y-4">
        {[
          { label: 'Make & Model', key: 'make_model', placeholder: 'e.g. Toyota Camry', icon: Car },
          { label: 'Year',        key: 'year',       placeholder: 'e.g. 2022', type: 'number', icon: Calendar },
          { label: 'Color',       key: 'color',      placeholder: 'e.g. Silver', icon: Palette },
          { label: 'License Plate', key: 'plate',    placeholder: 'e.g. ABC-1234', icon: Hash },
        ].map(({ label, key, placeholder, type, icon: Icon }) => (
          <div key={key} className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" /> {label} <span className="text-destructive">*</span>
            </label>
            <Input
              value={vehicle[key]}
              onChange={(e) => setVehicle({ ...vehicle, [key]: e.target.value })}
              placeholder={placeholder}
              type={type || 'text'}
              className="h-12 rounded-xl"
            />
          </div>
        ))}
      </div>
    </div>,

    // STEP 3 — Documents
    <div key="docs" className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-bold text-primary uppercase tracking-widest">Step 3 of 3</p>
        <h2 className="text-2xl font-display font-bold">Documents</h2>
        <p className="text-sm text-muted-foreground">Upload clear photos — both are required before you can drive.</p>
      </div>
      <div className="space-y-3">
        <FileUpload
          label="Driver's License"
          hint="Front of your valid state license"
          value={license.url}
          uploading={license.uploading}
          onChange={(f) => { if (f) uploadFile(f, setLicense); }}
        />
        <FileUpload
          label="Insurance Card"
          hint="Current proof of insurance"
          value={insurance.url}
          uploading={insurance.uploading}
          onChange={(f) => { if (f) uploadFile(f, setInsurance); }}
        />
      </div>
      <div className="rounded-xl bg-primary/8 border border-primary/20 p-4 flex gap-3">
        <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Your documents are securely stored and only reviewed by Dip Out administrators for approval purposes.
        </p>
      </div>
    </div>,

    // STEP 4 — Review
    <div key="review" className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-bold text-primary uppercase tracking-widest">Almost there!</p>
        <h2 className="text-2xl font-display font-bold">Review & Submit</h2>
        <p className="text-sm text-muted-foreground">Make sure everything looks right before submitting.</p>
      </div>

      <div className="rounded-2xl border border-border bg-secondary/30 overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/60 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Personal
          </p>
        </div>
        <div className="px-4">
          <ReviewRow icon={User}       label="Name"         value={user.full_name} />
          <ReviewRow icon={Smartphone} label="Phone"        value={personal.phone} />
          <ReviewRow icon={Calendar}   label="Date of Birth" value={personal.dob} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-secondary/30 overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/60 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5" /> Vehicle
          </p>
        </div>
        <div className="px-4">
          <ReviewRow icon={Car}      label="Make & Model"   value={vehicle.make_model} />
          <ReviewRow icon={Calendar} label="Year"           value={vehicle.year} />
          <ReviewRow icon={Palette}  label="Color"          value={vehicle.color} />
          <ReviewRow icon={Hash}     label="License Plate"  value={vehicle.plate?.toUpperCase()} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-secondary/30 overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/60 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Documents
          </p>
        </div>
        <div className="px-4">
          <ReviewRow icon={FileText} label="Driver's License" value={license.url ? '✓ Uploaded' : 'Missing'} />
          <ReviewRow icon={Shield}   label="Insurance Card"   value={insurance.url ? '✓ Uploaded' : 'Missing'} />
        </div>
      </div>

      <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 flex gap-3">
        <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          After submitting, an admin will review your application. You'll be notified once approved and can then go online to accept rides.
        </p>
      </div>
    </div>,
  ];

  const totalActionSteps = STEPS.length - 1; // exclude welcome
  const progressStep = step; // 0 = welcome (no bar shown), 1-4 = steps

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-28 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Car className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-display font-bold text-sm leading-none">Dip Out</p>
          <p className="text-xs text-muted-foreground">Driver application</p>
        </div>
      </div>

      {/* Step progress — hidden on welcome screen */}
      {step > 0 && (
        <div className="mb-8 space-y-2">
          <StepBar current={step} total={STEPS.length - 1} />
          <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
            {STEPS.slice(1).map((s, i) => (
              <span key={s.id} className={i + 1 === step ? 'text-primary font-semibold' : ''}>{s.title}</span>
            ))}
          </div>
        </div>
      )}

      {/* Animated slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {slides[step]}
        </motion.div>
      </AnimatePresence>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="h-14 rounded-2xl w-14 flex-shrink-0 p-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="h-14 rounded-2xl flex-1 font-bold text-base gap-2"
            >
              {step === 0 ? 'Get Started' : 'Continue'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving || license.uploading || insurance.uploading}
              className="h-14 rounded-2xl flex-1 font-bold text-base gap-2 bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Submit Application</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
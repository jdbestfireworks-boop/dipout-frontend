import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, User, Shield, FileText, CheckCircle2, ChevronRight, ChevronLeft, Upload, Loader2, AlertCircle } from 'lucide-react';

const STEPS = [
  { id: 'personal',  label: 'Personal Info', icon: User },
  { id: 'vehicle',   label: 'Vehicle',        icon: Car },
  { id: 'license',   label: 'License',        icon: FileText },
  { id: 'insurance', label: 'Insurance',      icon: Shield },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors
                ${done   ? 'bg-primary text-primary-foreground' : ''}
                ${active ? 'bg-primary/20 border-2 border-primary text-primary' : ''}
                ${!done && !active ? 'bg-secondary text-muted-foreground' : ''}
              `}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 mb-4 mx-1 ${done ? 'bg-primary' : 'bg-border'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Field({ label, required, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <Input {...props} className="h-11 rounded-xl" />
    </div>
  );
}

function FileUploadField({ label, value, uploading, onChange, required }) {
  const uploaded = typeof value === 'string'; // already a URL
  const selected = value instanceof File;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <label className={`flex items-center gap-3 min-h-[2.75rem] rounded-xl border px-3 py-2.5 cursor-pointer transition-colors text-sm
        ${uploaded ? 'border-primary/50 bg-primary/5 text-primary' : 'border-input bg-transparent hover:bg-accent text-muted-foreground'}
        ${uploading ? 'pointer-events-none opacity-60' : ''}
      `}>
        {uploading ? (
          <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary" />
        ) : uploaded ? (
          <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
        ) : (
          <Upload className="w-4 h-4 shrink-0" />
        )}
        <span className="truncate flex-1">
          {uploading ? 'Uploading…' : uploaded ? 'Document uploaded ✓' : selected ? value.name : 'Tap to upload photo or PDF'}
        </span>
        {uploaded && (
          <span className="text-[10px] text-primary font-semibold shrink-0">DONE</span>
        )}
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => onChange(e.target.files[0] || null)}
          disabled={uploading}
        />
      </label>
      {required && !uploaded && !uploading && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Required — upload a clear photo of your {label.toLowerCase()}
        </p>
      )}
    </div>
  );
}

export default function DriverOnboarding({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [personal, setPersonal] = useState({ phone: '', dob: '' });
  const [vehicle, setVehicle]   = useState({ make_model: '', year: '', plate: '', color: '' });
  const [license, setLicense]   = useState({ number: '', expiry: '', state: '', file: null, url: null, uploading: false });
  const [insurance, setInsurance] = useState({ provider: '', policy_number: '', expiry: '', file: null, url: null, uploading: false });

  const uploadFile = async (file, setter) => {
    if (!file) return null;
    setter((prev) => ({ ...prev, uploading: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setter((prev) => ({ ...prev, url: file_url, uploading: false }));
    return file_url;
  };

  const handleLicenseFileChange = (file) => {
    setLicense((prev) => ({ ...prev, file, url: null }));
    if (file) uploadFile(file, setLicense);
  };

  const handleInsuranceFileChange = (file) => {
    setInsurance((prev) => ({ ...prev, file, url: null }));
    if (file) uploadFile(file, setInsurance);
  };

  const canNext = () => {
    if (step === 0) return personal.phone && personal.dob;
    if (step === 1) return vehicle.make_model && vehicle.year && vehicle.plate && vehicle.color;
    if (step === 2) return license.number && license.expiry && license.state && license.url;
    if (step === 3) return insurance.provider && insurance.policy_number && insurance.expiry && insurance.url;
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
    // Step 0 — Personal
    <div key="personal" className="space-y-4">
      <div>
        <h2 className="text-xl font-display font-bold">Personal information</h2>
        <p className="text-sm text-muted-foreground mt-1">We need a few details to verify your identity.</p>
      </div>
      <Field label="Full name" value={user.full_name || ''} disabled placeholder="Your full name" />
      <Field label="Email" value={user.email} disabled placeholder="Email" />
      <Field required label="Phone number" value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} placeholder="+1 (555) 000-0000" type="tel" />
      <Field required label="Date of birth" value={personal.dob} onChange={(e) => setPersonal({ ...personal, dob: e.target.value })} type="date" />
    </div>,

    // Step 1 — Vehicle
    <div key="vehicle" className="space-y-4">
      <div>
        <h2 className="text-xl font-display font-bold">Vehicle details</h2>
        <p className="text-sm text-muted-foreground mt-1">Tell us about the car you'll be driving.</p>
      </div>
      <Field required label="Make & Model" value={vehicle.make_model} onChange={(e) => setVehicle({ ...vehicle, make_model: e.target.value })} placeholder="e.g. Toyota Prius" />
      <Field required label="Year" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} placeholder="e.g. 2022" type="number" />
      <Field required label="Color" value={vehicle.color} onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })} placeholder="e.g. Silver" />
      <Field required label="License plate" value={vehicle.plate} onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })} placeholder="e.g. ABC-1234" />
    </div>,

    // Step 2 — Driver's license
    <div key="license" className="space-y-4">
      <div>
        <h2 className="text-xl font-display font-bold">Driver's license</h2>
        <p className="text-sm text-muted-foreground mt-1">Your license must be valid. A photo upload is required.</p>
      </div>
      <Field required label="License number" value={license.number} onChange={(e) => setLicense({ ...license, number: e.target.value })} placeholder="e.g. D1234567" />
      <Field required label="Issuing state / province" value={license.state} onChange={(e) => setLicense({ ...license, state: e.target.value })} placeholder="e.g. Texas" />
      <Field required label="Expiry date" value={license.expiry} onChange={(e) => setLicense({ ...license, expiry: e.target.value })} type="date" />
      <FileUploadField
        required
        label="Driver's license photo"
        value={license.url || license.file}
        uploading={license.uploading}
        onChange={handleLicenseFileChange}
      />
    </div>,

    // Step 3 — Insurance
    <div key="insurance" className="space-y-4">
      <div>
        <h2 className="text-xl font-display font-bold">Vehicle insurance</h2>
        <p className="text-sm text-muted-foreground mt-1">Active insurance is required. An insurance card upload is mandatory.</p>
      </div>
      <Field required label="Insurance provider" value={insurance.provider} onChange={(e) => setInsurance({ ...insurance, provider: e.target.value })} placeholder="e.g. State Farm" />
      <Field required label="Policy number" value={insurance.policy_number} onChange={(e) => setInsurance({ ...insurance, policy_number: e.target.value })} placeholder="e.g. POL-123456" />
      <Field required label="Policy expiry date" value={insurance.expiry} onChange={(e) => setInsurance({ ...insurance, expiry: e.target.value })} type="date" />
      <FileUploadField
        required
        label="Insurance card"
        value={insurance.url || insurance.file}
        uploading={insurance.uploading}
        onChange={handleInsuranceFileChange}
      />
    </div>,
  ];

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-20">
      {/* Brand mark */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Car className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-display font-bold text-lg leading-none">Become a driver</p>
          <p className="text-xs text-muted-foreground mt-0.5">Step {step + 1} of {STEPS.length}</p>
        </div>
      </div>

      <StepIndicator current={step} />

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

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="h-12 rounded-xl flex-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext() || license.uploading || insurance.uploading}
            className="h-12 rounded-xl flex-1 font-semibold"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canNext() || saving || insurance.uploading}
            className="h-12 rounded-xl flex-1 font-semibold"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit & start driving'}
          </Button>
        )}
      </div>

      {step === STEPS.length - 1 && (
        <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">
          By submitting, you confirm all provided information is accurate and agree to Dip Out's driver terms of service.
        </p>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Clock, Calendar, X } from 'lucide-react';
import { format, addMinutes, startOfMinute } from 'date-fns';

// Round up to the nearest 15-min slot, at least 30 min from now
function getDefaultSchedule() {
  const now = new Date();
  const rounded = startOfMinute(addMinutes(now, 45));
  rounded.setMinutes(Math.ceil(rounded.getMinutes() / 15) * 15, 0, 0);
  return rounded;
}

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function SchedulePicker({ scheduledFor, onChange }) {
  const [open, setOpen] = useState(false);

  const minDateTime = toLocalInputValue(addMinutes(new Date(), 30));

  const handleToggle = () => {
    if (scheduledFor) {
      onChange(null);
    } else {
      setOpen(true);
      onChange(getDefaultSchedule().toISOString());
    }
  };

  const handleDateChange = (e) => {
    if (!e.target.value) return;
    onChange(new Date(e.target.value).toISOString());
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
            scheduledFor
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
          }`}
        >
          {scheduledFor ? (
            <>
              <Calendar className="w-4 h-4" />
              {format(new Date(scheduledFor), 'EEE, MMM d · h:mm a')}
              <X className="w-3.5 h-3.5 ml-1 opacity-70" />
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              Schedule for later
            </>
          )}
        </button>
      </div>

      {scheduledFor && (
        <div className="rounded-xl border border-border bg-card p-3">
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Pick a date & time</label>
          <input
            type="datetime-local"
            min={minDateTime}
            value={toLocalInputValue(new Date(scheduledFor))}
            onChange={handleDateChange}
            className="w-full bg-transparent text-sm font-medium text-foreground border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <p className="text-[10px] text-muted-foreground mt-1.5">Minimum 30 minutes from now</p>
        </div>
      )}
    </div>
  );
}
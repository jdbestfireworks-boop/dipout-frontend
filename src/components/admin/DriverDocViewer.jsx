import React, { useState } from 'react';
import { FileText, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DriverDocViewer({ drivers }) {
  const [expanded, setExpanded] = useState(null);

  const driversWithDocs = drivers.filter((d) => d.license_doc_url || d.insurance_doc_url);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <span className="font-semibold">Driver Documents</span>
        <span className="text-xs text-muted-foreground">{driversWithDocs.length} submitted</span>
      </div>
      <div className="divide-y divide-border">
        {drivers.map((d) => {
          const isOpen = expanded === d.id;
          const hasLicense = !!d.license_doc_url;
          const hasInsurance = !!d.insurance_doc_url;
          const allDocs = hasLicense && hasInsurance;
          return (
            <div key={d.id}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : d.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{d.user_email}</p>
                  <p className="text-xs text-muted-foreground">{d.vehicle} · {d.plate}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {allDocs ? (
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                    </Badge>
                  ) : (
                    <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]">
                      <XCircle className="w-3 h-3 mr-1" /> Missing docs
                    </Badge>
                  )}
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-secondary p-3 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Driver's License</p>
                    {hasLicense ? (
                      <a href={d.license_doc_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="w-full h-8 rounded-lg text-xs gap-1.5">
                          <ExternalLink className="w-3 h-3" /> View
                        </Button>
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not uploaded</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-secondary p-3 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Insurance Card</p>
                    {hasInsurance ? (
                      <a href={d.insurance_doc_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="w-full h-8 rounded-lg text-xs gap-1.5">
                          <ExternalLink className="w-3 h-3" /> View
                        </Button>
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not uploaded</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {drivers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No drivers yet.</p>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AddressAutocomplete({ placeholder, value, onChange, icon }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const iconBg = icon?.props?.className?.includes('text-primary') ? 'bg-primary/10' : 'bg-muted';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e) => {
    const val = e.target.value;
    onChange(val, null);
    
    if (val.trim().length >= 3) {
      setLoading(true);
      try {
        const response = await base44.functions.invoke('autocompleteAddress', { query: val });
        if (response.data.error) {
          console.error('Autocomplete API error:', response.data.error);
          toast.error('Unable to fetch addresses. Please try again.');
          setSuggestions([]);
        } else {
          setSuggestions(response.data.suggestions || []);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
        toast.error('Unable to fetch addresses. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (suggestion) => {
    if (!suggestion.lat || !suggestion.lng) {
      toast.error('Invalid location selected');
      return;
    }
    onChange(suggestion.description, { lat: suggestion.lat, lng: suggestion.lng });
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {icon && (
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      )}
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => value && value.length >= 3 && setIsOpen(true)}
        className={cn(
          "h-12 rounded-xl text-base font-medium pl-11",
          "bg-transparent border-border focus:border-primary transition-colors"
        )}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
      )}
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-xl max-h-80 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className={cn(
                "w-full px-4 py-3 text-left hover:bg-accent transition-colors",
                "flex items-start gap-3",
                index !== suggestions.length - 1 && "border-b border-border"
              )}
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                {suggestion.description && (
                  <div className="font-medium text-sm text-foreground leading-snug">{suggestion.description}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
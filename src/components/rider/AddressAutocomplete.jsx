import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

export default function AddressAutocomplete({ placeholder, value, onChange, icon }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

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
        const response = await base44.functions.invoke('googlePlacesAutocomplete', { query: val });
        setSuggestions(response.data.suggestions || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = async (suggestion) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('googlePlaceDetails', { 
        place_id: suggestion.place_id 
      });
      const { formatted_address, lat, lng } = response.data;
      onChange(formatted_address, { lat, lng });
      setIsOpen(false);
      setSuggestions([]);
    } catch (error) {
      console.error('Place details error:', error);
      // Fallback to plain text
      onChange(suggestion.description, null);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          {icon}
        </div>
      )}
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => value && value.length >= 3 && setIsOpen(true)}
        className={cn(
          "h-11 rounded-xl",
          icon && "pl-11"
        )}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
      )}
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className={cn(
                "w-full px-4 py-3 text-left text-sm hover:bg-accent transition-colors",
                "flex items-start gap-3",
                index !== suggestions.length - 1 && "border-b border-border"
              )}
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                {suggestion.structured_formatting?.main_text && (
                  <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
                )}
                {suggestion.structured_formatting?.secondary_text && (
                  <div className="text-xs text-muted-foreground">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
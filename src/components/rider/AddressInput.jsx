import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function AddressInput({ placeholder, value, onChange, icon }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value && value.length >= 3) {
        loadSuggestions(value);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSuggestions = async (query) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('googlePlacesAutocomplete', { query });
      if (response.data.suggestions) {
        setSuggestions(response.data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    onChange(suggestion.description, suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputChange = (e) => {
    onChange(e.target.value, null);
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
        onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
        className={icon ? 'pl-11 h-11 rounded-xl' : 'h-11 rounded-xl'}
        autoComplete="off"
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              onClick={() => selectSuggestion(suggestion)}
              className={`w-full px-4 py-3 text-left text-sm hover:bg-accent transition-colors flex items-start gap-3 ${
                index !== suggestions.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                {suggestion.structured_formatting?.main_text && (
                  <p className="font-medium text-foreground">
                    {suggestion.structured_formatting.main_text}
                  </p>
                )}
                {suggestion.structured_formatting?.secondary_text && (
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {suggestion.structured_formatting.secondary_text}
                  </p>
                )}
              </div>
            </button>
          ))}
        </motion.div>
      )}

      {showSuggestions && suggestions.length === 0 && value.length >= 3 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg p-4 text-center text-sm text-muted-foreground"
        >
          No addresses found
        </motion.div>
      )}
    </div>
  );
}
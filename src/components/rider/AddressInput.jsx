import React from 'react';
import { Input } from '@/components/ui/input';

export default function AddressInput({ placeholder, value, onChange, icon }) {
  const handleChange = (e) => {
    onChange(e.target.value, null);
  };

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {icon}
        </div>
      )}
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={icon ? 'pl-11 h-11 rounded-xl' : 'h-11 rounded-xl'}
      />
    </div>
  );
}
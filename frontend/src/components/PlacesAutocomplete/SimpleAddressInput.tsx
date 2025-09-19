import React from 'react';

interface SimpleAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Fallback component when Google Maps API is not available
const SimpleAddressInput: React.FC<SimpleAddressInputProps> = ({
  value,
  onChange,
  placeholder = "Enter address manually...",
  className = ""
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
};

export default SimpleAddressInput;

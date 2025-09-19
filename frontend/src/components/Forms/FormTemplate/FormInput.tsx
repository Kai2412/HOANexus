import React from 'react';

interface FormInputProps {
  type?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'password';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const FormInput: React.FC<FormInputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  onFocus,
  onBlur
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
  );
};

export default FormInput;

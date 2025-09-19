import React from 'react';

interface FormTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
  className = ''
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-primary rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent theme-transition disabled:opacity-50 disabled:cursor-not-allowed resize-vertical ${className}`}
    />
  );
};

export default FormTextarea;

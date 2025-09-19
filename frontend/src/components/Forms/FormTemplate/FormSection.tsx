import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children, className = '' }) => {
  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>
      {children}
    </div>
  );
};

export default FormSection;

"use client";

export interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function FormField({
  label,
  id,
  error,
  hint,
  helper,
  required,
  children,
}: FormFieldProps) {
  const displayHint = helper || hint;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {displayHint && !error && <p className="text-xs text-gray-500">{displayHint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

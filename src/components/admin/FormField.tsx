"use client";

export interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  helper?: string;
  required?: boolean;
  /** Small control rendered at the right end of the label row. */
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function FormField({
  label,
  id,
  error,
  hint,
  helper,
  required,
  action,
  children,
}: FormFieldProps) {
  const displayHint = helper || hint;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {action}
      </div>
      {children}
      {displayHint && !error && <p className="text-xs text-gray-500">{displayHint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

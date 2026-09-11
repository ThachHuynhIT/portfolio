"use client";

import FormField from "@/components/admin/FormField";
import type { FieldSpec, Lang } from "@/lib/section-field-specs";

export interface SectionFieldsEditorProps<T extends object> {
  title: string;
  helperText?: string;
  manageHref?: string;
  manageLabel?: string;
  value: T | undefined;
  defaultValue: T;
  fields: FieldSpec<T>[];
  activeLang: Lang;
  onChange: (next: T) => void;
}

export default function SectionFieldsEditor<T extends object>({
  title,
  helperText,
  manageHref,
  manageLabel,
  value,
  defaultValue,
  fields,
  activeLang,
  onChange,
}: SectionFieldsEditorProps<T>) {
  const inputClass =
    "w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500";

  return (
    <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {manageHref && (
          <a href={manageHref} className="text-xs text-purple-400 hover:text-purple-300 underline">
            {manageLabel ?? "Manage list →"}
          </a>
        )}
      </div>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}

      {fields.map((field) => {
        const inputId = `${title}-${field.id}`.replace(/[^a-zA-Z0-9-]/g, "-");
        const val = field.getValue(value, activeLang);
        const placeholder = field.getPlaceholder(defaultValue, activeLang);
        return (
          <FormField key={field.id} label={field.label} id={inputId}>
            {field.multiline ? (
              <textarea
                id={inputId}
                rows={field.rows ?? 3}
                value={val}
                placeholder={placeholder}
                onChange={(e) => onChange(field.setValue(value, activeLang, e.target.value))}
                className={inputClass}
              />
            ) : (
              <input
                id={inputId}
                type="text"
                value={val}
                placeholder={placeholder}
                onChange={(e) => onChange(field.setValue(value, activeLang, e.target.value))}
                className={inputClass}
              />
            )}
          </FormField>
        );
      })}

      <button
        type="button"
        onClick={() => onChange({} as T)}
        className="text-xs text-gray-400 hover:text-white underline"
      >
        Reset all fields in this section to defaults
      </button>
    </div>
  );
}

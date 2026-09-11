"use client";

import { useEffect, useState } from "react";

export interface SectionJsonEditorProps<T extends object> {
  title: string;
  helperText?: string;
  value: T | undefined;
  /**
   * The section's currently effective copy (sourced from the locale files),
   * used to pre-fill the editor when there is no saved override yet — so
   * admins see real field names/values to start from instead of "{}".
   * Purely a display seed: it is never written back unless the admin
   * actually edits the textarea.
   */
  defaultValue?: T;
  onChange: (next: T) => void;
  manageHref?: string;
  manageLabel?: string;
}

function isEmptyValue(value: unknown): boolean {
  return !value || (typeof value === "object" && Object.keys(value).length === 0);
}

export default function SectionJsonEditor<T extends object>({
  title,
  helperText,
  value,
  defaultValue,
  onChange,
  manageHref,
  manageLabel,
}: SectionJsonEditorProps<T>) {
  const showingDefaults = isEmptyValue(value);
  const [text, setText] = useState(() =>
    JSON.stringify(showingDefaults ? defaultValue ?? {} : value, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(isEmptyValue(value) ? defaultValue ?? {} : value, null, 2));
    setError(null);
    // Only re-sync when the parent hands us a genuinely different object
    // (e.g. switching tabs or loading), not on every keystroke we emit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (raw: string) => {
    setText(raw);
    try {
      const parsed = raw.trim() ? JSON.parse(raw) : {};
      setError(null);
      onChange(parsed as T);
    } catch {
      setError("Invalid JSON — changes not applied until this is fixed.");
    }
  };

  const handleReset = () => {
    setText(JSON.stringify(defaultValue ?? {}, null, 2));
    setError(null);
    onChange({} as T);
  };

  return (
    <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {manageHref && (
          <a href={manageHref} className="text-xs text-purple-400 hover:text-purple-300 underline">
            {manageLabel ?? "Manage list →"}
          </a>
        )}
      </div>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
      {showingDefaults && defaultValue && (
        <p className="text-[11px] text-purple-300/80">
          Showing the site&apos;s current default text — edit any field below to override it, or leave as-is.
        </p>
      )}
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        rows={16}
        spellCheck={false}
        className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white font-mono text-xs focus:outline-none ${
          error ? "border-red-500" : "border-gray-700 focus:border-purple-500"
        }`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="button"
        onClick={handleReset}
        className="text-xs text-gray-400 hover:text-white underline"
      >
        Reset to defaults
      </button>
    </div>
  );
}

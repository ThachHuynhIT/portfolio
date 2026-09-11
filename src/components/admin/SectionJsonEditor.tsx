"use client";

import { useEffect, useState } from "react";

export interface SectionJsonEditorProps<T extends object> {
  title: string;
  helperText?: string;
  value: T | undefined;
  onChange: (next: T) => void;
  manageHref?: string;
  manageLabel?: string;
}

export default function SectionJsonEditor<T extends object>({
  title,
  helperText,
  value,
  onChange,
  manageHref,
  manageLabel,
}: SectionJsonEditorProps<T>) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(value ?? {}, null, 2));
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
    setText("{}");
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

"use client";

import { useState } from "react";
import { MAX_NAME_LENGTH } from "@/lib/tienlen";

export function NameForm({
  initial,
  submitLabel,
  onSubmit,
  busy,
}: {
  initial: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  busy?: boolean;
}) {
  const [name, setName] = useState(initial);
  const trimmed = name.trim();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed) onSubmit(trimmed);
      }}
      className="flex flex-col gap-3"
    >
      <label className="text-sm text-emerald-100/70" htmlFor="tl-name">
        Tên của bạn
      </label>
      <input
        id="tl-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={MAX_NAME_LENGTH}
        // Only when there is no saved name: on phones autofocus pops the keyboard over the lobby.
        autoFocus={!initial}
        autoComplete="nickname"
        enterKeyHint="go"
        placeholder="VD: Thạch"
        className="rounded-lg border border-emerald-200/20 bg-black/30 px-3 py-2 text-white outline-none placeholder:text-emerald-100/30 focus:border-amber-400"
      />
      <button
        type="submit"
        disabled={!trimmed || busy}
        className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black transition-colors hover:bg-amber-300 disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </form>
  );
}

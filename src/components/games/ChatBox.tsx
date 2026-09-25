"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CHAT_MAX_LENGTH, type ChatMessage } from "@/lib/tienlen";
import { cn } from "@/lib/utils";

/**
 * Floating room chat (bottom-right), shared by every game: free text for players and
 * spectators, unread badge, and a short preview of new messages while it is closed.
 */
export function ChatBox({
  messages = [],
  meId,
  myName,
  onSend,
}: {
  messages?: ChatMessage[];
  meId: string;
  /** Spectators have no seat id, so their own lines are matched by name. */
  myName?: string;
  onSend: (text: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [seenId, setSeenId] = useState<string | null>(() => messages.at(-1)?.id ?? null);
  const [preview, setPreview] = useState<ChatMessage | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const mine = (m: ChatMessage) => (meId ? m.playerId === meId : !m.playerId && m.name === myName);
  const lastId = messages.at(-1)?.id ?? null;
  const seenIndex = seenId ? messages.findIndex((m) => m.id === seenId) : -1;
  const unread = open ? 0 : messages.slice(seenIndex + 1).filter((m) => !mine(m)).length;

  // Mark everything read while open; otherwise pop a preview of the newest line from someone else.
  const lastSeenLast = useRef(lastId);
  useEffect(() => {
    if (lastId === lastSeenLast.current) return;
    lastSeenLast.current = lastId;
    const latest = messages.at(-1);
    if (open) setSeenId(lastId);
    else if (latest && !mine(latest)) setPreview(latest);
  }, [lastId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!preview) return;
    const t = setTimeout(() => setPreview(null), 3500);
    return () => clearTimeout(t);
  }, [preview]);

  useEffect(() => {
    if (!open) return;
    setSeenId(lastId);
    setPreview(null);
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    inputRef.current?.focus();
  }, [open, lastId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    if (await onSend(t)) setText("");
    setSending(false);
    inputRef.current?.focus();
  };

  const time = (at: number) => new Date(at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96, pointerEvents: "none" }}
            className="flex h-[min(26rem,65dvh)] w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0d1712]/95 text-sm text-white shadow-2xl backdrop-blur"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <b>💬 Trò chuyện</b>
              <button onClick={() => setOpen(false)} className="rounded px-2 text-white/60 hover:bg-white/10" aria-label="Đóng chat">
                ✕
              </button>
            </div>
            <div ref={listRef} className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-2">
              {messages.length === 0 && <p className="m-auto text-center text-xs text-white/40">Chưa có tin nhắn nào — chào mọi người đi!</p>}
              {messages.map((m) => (
                <div key={m.id} className={cn("flex max-w-[85%] flex-col", mine(m) ? "items-end self-end" : "items-start self-start")}>
                  {!mine(m) && (
                    <span className="px-1 text-[11px] text-white/50">
                      {m.name}
                      {!m.playerId && " 👀"}
                    </span>
                  )}
                  <span
                    className={cn(
                      "whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5",
                      mine(m) ? "rounded-br-sm bg-amber-400 text-black" : "rounded-bl-sm bg-white/10",
                    )}
                    title={time(m.at)}
                  >
                    {m.text}
                  </span>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-2">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, CHAT_MAX_LENGTH))}
                placeholder="Nhắn gì đó…"
                maxLength={CHAT_MAX_LENGTH}
                className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-1.5 outline-none placeholder:text-white/40 focus:ring-1 focus:ring-amber-300"
                aria-label="Tin nhắn"
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="rounded-lg bg-amber-400 px-3 py-1.5 font-semibold text-black hover:bg-amber-300 disabled:opacity-40"
              >
                Gửi
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {preview && !open && (
          <motion.button
            key={preview.id}
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, pointerEvents: "none" }}
            className="max-w-[16rem] truncate rounded-2xl rounded-br-sm bg-white px-3 py-1.5 text-left text-sm text-black shadow-lg"
          >
            <b>{preview.name}:</b> {preview.text}
          </motion.button>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-2xl text-black shadow-lg transition-transform hover:scale-105"
        aria-label={open ? "Đóng chat" : "Mở chat"}
        aria-expanded={open}
      >
        💬
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}

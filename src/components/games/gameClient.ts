"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared WebSocket client for the be_game backend (Tiến Lên, Mèo Nổ, …).
 * Handles acks, heartbeats, reconnect with backoff and the planned hand-over
 * the server asks for shortly before a Vercel function hits its time limit.
 */

const TOKEN_KEY = "tienlen:token";
const NAME_KEY = "tienlen:name";
/** Clients ping this often; the ping doubles as the presence heartbeat. */
const PING_INTERVAL_MS = 10_000;

export type Ack = { ok: true; code?: string } | { ok: false; error: string };
export type ConnectionStatus = "connecting" | "joined" | "reconnecting" | "error";

/** Base URL of the be_game backend (NEXT_PUBLIC_TIENLEN_SERVER_URL, default: its local dev server). */
export const serverBase = () => (process.env.NEXT_PUBLIC_TIENLEN_SERVER_URL || "http://localhost:4000").replace(/\/$/, "");

const wsUrl = (path: string) => serverBase().replace(/^http/, "ws") + path;

/** GET a JSON endpoint of the backend (rooms list, leaderboard). */
export async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(serverBase() + path, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

const randomToken = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from({ length: 4 }, () => Math.random().toString(36).slice(2)).join("");

/**
 * Secret reconnect token. Kept in sessionStorage so a reload keeps the seat,
 * while separate tabs act as separate players.
 */
let memoryToken: string | null = null;
export function getToken(): string {
  try {
    let t = sessionStorage.getItem(TOKEN_KEY);
    if (!t) {
      t = randomToken();
      sessionStorage.setItem(TOKEN_KEY, t);
    }
    return t;
  } catch {
    return (memoryToken ??= randomToken());
  }
}

export function getSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* storage unavailable — name just won't be remembered */
  }
}

type ServerMessage = ({ type: "ack"; id: number } & Ack) | { type: "state"; view: unknown } | { type: "reconnect" } | { type: "pong" };

/** One WebSocket with request/ack bookkeeping. */
class Channel {
  readonly ws: WebSocket;
  private nextId = 1;
  private pending = new Map<number, (res: Ack) => void>();
  onMessage: (msg: ServerMessage) => void = () => {};
  onClose: () => void = () => {};

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (e) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(String(e.data));
      } catch {
        return;
      }
      if (msg.type === "ack") {
        // The ack carries the Ack fields (plus harmless `type`/`id`).
        this.pending.get(msg.id)?.(msg as Ack);
        this.pending.delete(msg.id);
      } else {
        this.onMessage(msg);
      }
    };
    this.ws.onclose = () => {
      this.pending.forEach((resolve) => resolve({ ok: false, error: "Mất kết nối máy chủ" }));
      this.pending.clear();
      this.onClose();
    };
  }

  opened(timeoutMs = 10_000): Promise<boolean> {
    if (this.ws.readyState === WebSocket.OPEN) return Promise.resolve(true);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeoutMs);
      this.ws.addEventListener("open", () => (clearTimeout(timer), resolve(true)), { once: true });
      this.ws.addEventListener("close", () => (clearTimeout(timer), resolve(false)), { once: true });
    });
  }

  request(msg: Record<string, unknown> & { type: string }, timeoutMs = 10_000): Promise<Ack> {
    if (this.ws.readyState !== WebSocket.OPEN) return Promise.resolve({ ok: false, error: "Mất kết nối máy chủ" });
    const id = this.nextId++;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve({ ok: false, error: "Máy chủ không phản hồi" });
      }, timeoutMs);
      this.pending.set(id, (res) => {
        clearTimeout(timer);
        resolve(res);
      });
      this.ws.send(JSON.stringify({ ...msg, id }));
    });
  }

  ping() {
    if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: "ping" }));
  }

  close() {
    this.onClose = () => {};
    this.ws.close(1000);
  }
}

/** Ask the server for a new room code using a short-lived connection. */
export async function createGameRoom(wsPath: string): Promise<string> {
  const ch = new Channel(wsUrl(wsPath));
  try {
    if (!(await ch.opened(8000))) throw new Error("Không kết nối được máy chủ game");
    const res = await ch.request({ type: "create" });
    if (!res.ok) throw new Error(res.error);
    if (!res.code) throw new Error("Không tạo được phòng");
    return res.code;
  } finally {
    ch.close();
  }
}

export type Call = (msg: Record<string, unknown> & { type: string }) => Promise<Ack>;

/**
 * Join (or watch) a room over `wsPath` and keep its latest view.
 * `localize` can shift server-clock deadlines onto the local clock.
 */
export function useGameRoom<V>(
  wsPath: string,
  code: string,
  name: string | null,
  mode: "play" | "watch" = "play",
  localize: (view: V) => V = (v) => v,
) {
  const [view, setView] = useState<V | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const localizeRef = useRef(localize);
  localizeRef.current = localize;

  useEffect(() => {
    if (!name) return;
    let disposed = false;
    let retry = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const token = getToken();

    /**
     * Open a channel and join. Used for the first connection, after drops, and
     * for a planned hand-over (`reconnect` from the server before the platform
     * cuts the connection): the new channel joins before the old one closes.
     */
    const open = async () => {
      if (disposed) return;
      const ch = new Channel(wsUrl(wsPath));
      ch.onMessage = (msg) => {
        if (msg.type === "state") setView(localizeRef.current(msg.view as V));
        else if (msg.type === "reconnect" && channelRef.current === ch) void open();
      };
      ch.onClose = () => {
        if (disposed || channelRef.current !== ch) return;
        channelRef.current = null;
        setStatus((s) => (s === "error" ? s : "reconnecting"));
        scheduleRetry();
      };

      if (!(await ch.opened())) {
        ch.close();
        if (!channelRef.current) {
          setStatus((s) => (s === "joined" ? "reconnecting" : s));
          scheduleRetry();
        }
        return;
      }
      const res = await ch.request({ type: mode === "watch" ? "watch" : "join", code, name, token });
      if (disposed) return ch.close();
      if (!res.ok) {
        ch.close();
        setStatus("error");
        setError(res.error);
        return;
      }
      const previous = channelRef.current;
      channelRef.current = ch;
      previous?.close();
      retry = 0;
      setStatus("joined");
      setError(null);
    };

    const scheduleRetry = () => {
      if (disposed || retryTimer) return;
      const delay = Math.min(500 * 2 ** retry++, 8000);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void open();
      }, delay);
    };

    const pinger = setInterval(() => channelRef.current?.ping(), PING_INTERVAL_MS);
    // Come back fast when the tab regains focus or the network returns.
    const wake = () => {
      if (!channelRef.current && !retryTimer) void open();
    };
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);

    void open();

    return () => {
      disposed = true;
      clearInterval(pinger);
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
      const ch = channelRef.current;
      channelRef.current = null;
      if (ch) void ch.request({ type: "leave" }, 1500).finally(() => ch.close());
    };
  }, [wsPath, code, name, mode]);

  const call: Call = useCallback((msg) => {
    const ch = channelRef.current;
    return ch ? ch.request(msg) : Promise.resolve<Ack>({ ok: false, error: "Mất kết nối máy chủ" });
  }, []);

  return { view, status, error, call };
}

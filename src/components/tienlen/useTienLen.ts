"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  AckResult,
  Card,
  ClientToServerEvents,
  RoomView,
  ServerToClientEvents,
} from "@/lib/tienlen";

type TLSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const GAME_PORT = process.env.NEXT_PUBLIC_TIENLEN_SERVER_PORT || "4000";

/**
 * Default game server: NEXT_PUBLIC_TIENLEN_SERVER_URL if set, otherwise the
 * same host the page was loaded from on the game port — so when both run on
 * one machine (`npm run tienlen:host`), http://<your-ip>:3000 talks to
 * http://<your-ip>:4000 with no configuration.
 */
const defaultServerUrl = () =>
  process.env.NEXT_PUBLIC_TIENLEN_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:${GAME_PORT}`;

const TOKEN_KEY = "tienlen:token";
const NAME_KEY = "tienlen:name";
const SERVER_KEY = "tienlen:server";

const normalizeServer = (raw: string | null): string | null => {
  if (!raw) return null;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
};

/**
 * Game server to connect to. A `?server=` query param (put in invite links by
 * `npm run share` in game-server/) overrides the build-time default and is
 * remembered for this tab, so a server running on someone's own machine
 * works without redeploying the site.
 */
export function getServerUrl(): string {
  try {
    const fromQuery = normalizeServer(new URLSearchParams(window.location.search).get("server"));
    if (fromQuery) sessionStorage.setItem(SERVER_KEY, fromQuery);
    return fromQuery ?? normalizeServer(sessionStorage.getItem(SERVER_KEY)) ?? defaultServerUrl();
  } catch {
    return defaultServerUrl();
  }
}

/** Invite link for a room; carries the server override when one is in use. */
export function inviteLink(code: string): string {
  const url = new URL(`/tien-len/${code}`, window.location.origin);
  const server = getServerUrl();
  if (server !== defaultServerUrl()) url.searchParams.set("server", server);
  return url.toString();
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

const connect = (): TLSocket => io(getServerUrl(), { transports: ["websocket", "polling"] });

/** Ask the server for a new room code using a short-lived connection. */
export function createRoom(name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = connect();
    const fail = (msg: string) => {
      socket.disconnect();
      reject(new Error(msg));
    };
    const timer = setTimeout(() => fail("Không kết nối được máy chủ game"), 8000);
    socket.on("connect", () => {
      socket.emit("room:create", { name, token: getToken() }, (res) => {
        clearTimeout(timer);
        socket.disconnect();
        if (res.ok) resolve(res.code);
        else reject(new Error(res.error));
      });
    });
  });
}

export type ConnectionStatus = "connecting" | "joined" | "reconnecting" | "error";

export function useTienLenRoom(code: string, name: string | null) {
  const [view, setView] = useState<RoomView | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<TLSocket | null>(null);

  useEffect(() => {
    if (!name) return;
    const socket = connect();
    socketRef.current = socket;

    const join = () =>
      socket.emit("room:join", { code, name, token: getToken() }, (res) => {
        if (res.ok) {
          setStatus("joined");
          setError(null);
        } else {
          setStatus("error");
          setError(res.error);
        }
      });

    socket.on("connect", join);
    socket.on("disconnect", () => setStatus((s) => (s === "error" ? s : "reconnecting")));
    socket.on("connect_error", () => setStatus((s) => (s === "joined" ? "reconnecting" : s)));
    socket.on("state", setView);

    return () => {
      socket.emit("room:leave");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [code, name]);

  const call = useCallback(
    (fn: (s: TLSocket, ack: (r: AckResult) => void) => void) =>
      new Promise<AckResult>((resolve) => {
        const s = socketRef.current;
        if (!s?.connected) return resolve({ ok: false, error: "Mất kết nối máy chủ" });
        fn(s, resolve);
      }),
    [],
  );

  const play = useCallback((cards: Card[]) => call((s, ack) => s.emit("game:play", { cards }, ack)), [call]);
  const pass = useCallback(() => call((s, ack) => s.emit("game:pass", ack)), [call]);
  const start = useCallback(() => call((s, ack) => s.emit("game:start", ack)), [call]);

  return { view, status, error, play, pass, start };
}

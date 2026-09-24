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

export const SERVER_URL = process.env.NEXT_PUBLIC_TIENLEN_SERVER_URL || "http://localhost:4000";

const TOKEN_KEY = "tienlen:token";
const NAME_KEY = "tienlen:name";

/**
 * Secret reconnect token. Kept in sessionStorage so a reload keeps the seat,
 * while separate tabs act as separate players.
 */
export function getToken(): string {
  try {
    let t = sessionStorage.getItem(TOKEN_KEY);
    if (!t) {
      t = crypto.randomUUID();
      sessionStorage.setItem(TOKEN_KEY, t);
    }
    return t;
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
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

const connect = (): TLSocket => io(SERVER_URL, { transports: ["websocket", "polling"] });

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

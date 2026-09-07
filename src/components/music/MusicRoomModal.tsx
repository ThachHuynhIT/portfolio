"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic } from "@/context/MusicContext";
import { useTranslation } from "@/context/LanguageContext";

function generate5CharCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function MusicRoomModal() {
  const { t } = useTranslation();
  const {
    isRoomModalOpen,
    setIsRoomModalOpen,
    createRoom,
    joinRoom,
    myMemberName,
    prefilledRoomCode,
    setPrefilledRoomCode,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [createCode, setCreateCode] = useState(() => generate5CharCode());
  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState(myMemberName || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledRoomCode) {
      setJoinCode(prefilledRoomCode.toUpperCase().substring(0, 5));
      setActiveTab("join");
    }
  }, [prefilledRoomCode]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("Please enter your nickname");
      return;
    }
    const cleanCode = createCode.trim().toUpperCase();
    if (cleanCode.length !== 5 || !/^[A-Z0-9]{5}$/.test(cleanCode)) {
      setError("Room code must be exactly 5 alphanumeric characters (A-Z, 0-9)");
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await createRoom(cleanCode, nickname.trim());
    setIsLoading(false);

    if (result.success) {
      setIsRoomModalOpen(false);
    } else {
      setError(result.error || "Failed to create room");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("Please enter your nickname");
      return;
    }
    const cleanCode = joinCode.trim().toUpperCase();
    if (cleanCode.length !== 5 || !/^[A-Z0-9]{5}$/.test(cleanCode)) {
      setError("Please enter a valid 5-character room code (e.g. VIBE7)");
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await joinRoom(cleanCode, nickname.trim());
    setIsLoading(false);

    if (result.success) {
      setIsRoomModalOpen(false);
    } else {
      setError(result.error || "Room not found or expired");
    }
  };

  return (
    <AnimatePresence>
      {isRoomModalOpen && (
        <motion.div
          key="room-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="music-room-modal-backdrop"
          onClick={() => setIsRoomModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="music-room-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-xl shadow-lg shadow-purple-500/30">
                  🎧
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">{t("music.room.modalTitle", "Listen Together")}</h2>
                  <p className="text-xs text-white/50">{t("music.room.modalSubtitle", "Sync music live with friends in shared rooms")}</p>
                </div>
              </div>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-sm transition-colors"
                title={t("music.room.close", "Close")}
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-xl mb-4 border border-white/10">
              <button
                onClick={() => {
                  setActiveTab("create");
                  setError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "create"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                ✨ {t("music.room.createTab", "Create Room")}
              </button>
              <button
                onClick={() => {
                  setActiveTab("join");
                  setError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "join"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                🚀 {t("music.room.joinTab", "Join by Code")}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {activeTab === "create" ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                    {t("music.room.nicknameLabel", "Your Nickname")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("music.room.nicknamePlaceholder", "Enter your display name...")}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={20}
                    required
                    className="music-room-input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                      {t("music.room.roomCodeLabel", "Room Code (Exactly 5 Characters)")}
                    </label>
                    <button
                      type="button"
                      onClick={() => setCreateCode(generate5CharCode())}
                      className="text-[11px] text-purple-400 hover:text-purple-300 underline"
                    >
                      🎲 {t("music.room.createTab", "Generate New")}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={createCode}
                      onChange={(e) =>
                        setCreateCode(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "")
                            .substring(0, 5)
                        )
                      }
                      maxLength={5}
                      required
                      className="music-room-input text-center tracking-[0.35em] text-lg font-mono font-bold text-purple-300 uppercase"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 font-mono">
                      {createCode.length}/5
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || createCode.length !== 5}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 text-white font-bold text-sm shadow-lg shadow-purple-500/30 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {isLoading ? t("music.room.connecting", "Creating Room...") : `${t("music.room.createBtn", "Create Room")} #${createCode}`}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                    {t("music.room.nicknameLabel", "Your Nickname")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("music.room.nicknamePlaceholder", "Enter your display name...")}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={20}
                    required
                    className="music-room-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                    {t("music.room.roomCodeLabel", "Enter 5-Character Room Code")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t("music.room.roomCodePlaceholder", "ABCDE")}
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "")
                            .substring(0, 5)
                        )
                      }
                      maxLength={5}
                      required
                      className="music-room-input text-center tracking-[0.35em] text-lg font-mono font-bold text-cyan-300 uppercase placeholder:tracking-normal placeholder:font-sans placeholder:text-white/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 font-mono">
                      {joinCode.length}/5
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || joinCode.length !== 5}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/30 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {isLoading ? t("music.room.connecting", "Joining Lounge...") : `${t("music.room.joinBtn", "Join Room")} #${joinCode || "_____"}`}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

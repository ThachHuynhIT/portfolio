"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMusic } from "@/context/MusicContext";
import { useTranslation } from "@/context/LanguageContext";

const REACTIONS = ["❤️", "🔥", "🎧", "🚀", "👏", "✨", "💯", "🎉"];

export default function MusicRoomBar() {
  const { t } = useTranslation();
  const {
    room,
    myMemberId,
    leaveRoom,
    sendReaction,
    sendChatMessage,
    isRoomChatOpen,
    setIsRoomChatOpen,
  } = useMusic();

  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRoomChatOpen && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [room?.messages.length, isRoomChatOpen]);

  if (!room) return null;

  const isHost = room.hostId === myMemberId;

  const handleCopyCode = () => {
    const inviteUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/music?room=${room.code}`
        : room.code;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput("");
  };

  return (
    <>
      {/* ── Top Floating Room Status Bar ── */}
      <div className="music-room-bar">
        {/* Left: Room Badge + Copy */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold font-mono">
            <span>🎧 {t("music.room.roomBadge", "ROOM")} #{room.code}</span>
            {isHost && <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 rounded-full">{t("music.room.hostBadge", "HOST")}</span>}
          </div>

          <button
            onClick={handleCopyCode}
            className="px-2.5 py-1 rounded-lg bg-white/10 light:bg-neutral-900/[0.06] hover:bg-white/20 light:hover:bg-neutral-900/10 text-[11px] text-white/80 light:text-neutral-800 hover:text-white light:hover:text-neutral-900 transition-colors flex items-center gap-1"
            title="Copy Full Room Invite Link"
          >
            <span>{copied ? t("music.room.linkCopied", "✓ Link Copied!") : t("music.room.inviteLink", "🔗 Invite Link")}</span>
          </button>
        </div>

        {/* Center: Live Listeners count + Avatars */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center -space-x-1.5">
            {room.members.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="w-6 h-6 rounded-full border border-black flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ background: member.color }}
                title={`${member.name} ${member.isHost ? "(Host)" : ""}`}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-xs text-white/60 light:text-neutral-600">
            {room.members.length} {room.members.length === 1 ? t("music.room.listener", "listener") : t("music.room.listeners", "listeners")}
          </span>
        </div>

        {/* Right: Quick Reactions, Chat Toggle & Leave */}
        <div className="flex items-center gap-1.5">
          {/* Reaction Triggers */}
          <div className="flex items-center gap-1 bg-white/5 light:bg-neutral-900/[0.04] p-1 rounded-xl border border-white/10 light:border-neutral-900/10">
            {REACTIONS.slice(0, 4).map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 light:hover:bg-neutral-900/[0.06] active:scale-125 flex items-center justify-center text-sm transition-transform"
                title={`Send ${emoji} reaction`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Drawer Toggle */}
          <button
            onClick={() => setIsRoomChatOpen(!isRoomChatOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isRoomChatOpen
                ? "bg-cyan-500 text-black border-cyan-400 font-bold"
                : "bg-white/10 light:bg-neutral-900/[0.06] hover:bg-white/15 light:hover:bg-neutral-900/10 text-white/90 light:text-neutral-800 border-white/10 light:border-neutral-900/10"
            }`}
            title="Open Room Live Chat"
          >
            <span>💬</span>
            <span className="hidden md:inline">{t("music.room.chat", "Chat")}</span>
            {room.messages.length > 0 && (
              <span className="bg-purple-600 text-white text-[10px] px-1.5 rounded-full">
                {room.messages.length}
              </span>
            )}
          </button>

          {/* Leave Room Button */}
          <button
            onClick={leaveRoom}
            className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
            title={t("music.room.leaveTooltip", "Leave this room")}
          >
            ✕ {t("music.room.leave", "Leave")}
          </button>
        </div>
      </div>

      {/* ── Live Room Chat Drawer ── */}
      <AnimatePresence>
        {isRoomChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="music-room-chat-drawer"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 light:border-neutral-900/10 bg-white/5 light:bg-neutral-900/[0.04]">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <span className="font-bold text-xs text-white light:text-neutral-900">Room #{room.code} Chat</span>
                <span className="text-[10px] text-white/40 light:text-neutral-500">({room.members.length} {t("music.room.online", "online")})</span>
              </div>
              <button
                onClick={() => setIsRoomChatOpen(false)}
                className="text-white/40 light:text-neutral-500 hover:text-white light:hover:text-neutral-900 text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="music-room-chat-messages">
              {room.messages.map((msg) => (
                <div key={msg.id} className="music-chat-msg">
                  <div className="flex items-baseline gap-1.5">
                    <span className="music-chat-sender" style={{ color: msg.color }}>
                      {msg.sender}
                    </span>
                    <span className="music-chat-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="music-chat-text">{msg.text}</div>
                </div>
              ))}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Quick Reactions Bar in Chat */}
            <div className="px-3 py-1.5 border-t border-white/5 light:border-neutral-900/10 bg-white/[0.02] light:bg-neutral-900/[0.04] flex items-center justify-between">
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="hover:scale-125 transition-transform text-sm p-1"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-2.5 border-t border-white/10 light:border-neutral-900/10 flex gap-2">
              <input
                type="text"
                placeholder={t("music.room.chatPlaceholder", "Say something to the lounge...")}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                maxLength={200}
                className="music-chat-input"
              />
              <button type="submit" className="music-chat-send-btn" title={t("music.room.send", "Send Message")}>
                ➤
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

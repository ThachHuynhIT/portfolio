import { NextRequest, NextResponse } from "next/server";
import { MusicRoom, RoomMember, LiveReaction, RoomMessage } from "../route";

declare global {
  // eslint-disable-next-line no-var
  var globalMusicRooms: Map<string, MusicRoom> | undefined;
}

const rooms = globalThis.globalMusicRooms || new Map<string, MusicRoom>();
globalThis.globalMusicRooms = rooms;

const COLORS = ["#a855f7", "#06b6d4", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#14b8a6"];

// GET /api/music/rooms/[code] — get real-time room state
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code?.toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    return NextResponse.json({ error: "Room not found or expired" }, { status: 404 });
  }

  // Filter out expired reactions older than 10 seconds
  const now = Date.now();
  room.reactions = room.reactions.filter((r) => now - r.createdAt < 10000);

  // Filter out members inactive for > 45 seconds (except host)
  room.members = room.members.filter((m) => m.isHost || now - m.lastActive < 45000);

  return NextResponse.json({ success: true, room });
}

// POST /api/music/rooms/[code] — perform action in room
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code?.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      return NextResponse.json({ error: "Room not found or expired" }, { status: 404 });
    }

    const body = await req.json();
    const { action, memberId, memberName, trackId, isPlaying, currentTime, emoji, text } = body;
    const now = Date.now();

    room.lastUpdated = now;

    // 1. ACTION: JOIN ROOM
    if (action === "join") {
      if (!memberName) {
        return NextResponse.json({ error: "memberName is required" }, { status: 400 });
      }

      const id = memberId || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const existingMember = room.members.find((m) => m.id === id);

      if (existingMember) {
        existingMember.name = memberName;
        existingMember.lastActive = now;
      } else {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        room.members.push({
          id,
          name: memberName.trim(),
          isHost: false,
          color,
          lastActive: now,
        });

        // Add system message
        room.messages.push({
          id: `msg_${Date.now()}`,
          sender: "System",
          text: `👋 ${memberName} joined the lounge!`,
          color: "#a855f7",
          createdAt: now,
        });
      }

      return NextResponse.json({ success: true, room, memberId: id });
    }

    // 2. ACTION: SYNC PLAYBACK (from host or authorized member)
    if (action === "sync") {
      if (trackId !== undefined) room.trackId = trackId;
      if (isPlaying !== undefined) room.isPlaying = isPlaying;
      if (currentTime !== undefined) room.currentTime = currentTime;

      // Update sender heartbeat
      if (memberId) {
        const member = room.members.find((m) => m.id === memberId);
        if (member) member.lastActive = now;
      }

      return NextResponse.json({ success: true, room });
    }

    // 3. ACTION: SEND LIVE REACTION
    if (action === "reaction") {
      if (!emoji) {
        return NextResponse.json({ error: "emoji is required" }, { status: 400 });
      }

      const newReaction: LiveReaction = {
        id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        emoji,
        sender: memberName || "Anonymous",
        createdAt: now,
        x: Math.floor(Math.random() * 80) + 10, // 10% to 90%
      };

      room.reactions.push(newReaction);
      // Keep max 20 active reactions
      if (room.reactions.length > 20) {
        room.reactions = room.reactions.slice(-20);
      }

      return NextResponse.json({ success: true, reaction: newReaction, room });
    }

    // 4. ACTION: SEND CHAT MESSAGE
    if (action === "chat") {
      if (!text || !text.trim()) {
        return NextResponse.json({ error: "text is required" }, { status: 400 });
      }

      const senderMember = room.members.find((m) => m.id === memberId);
      const color = senderMember ? senderMember.color : "#06b6d4";

      const newMessage: RoomMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender: memberName || "Listener",
        text: text.trim().substring(0, 250),
        color,
        createdAt: now,
      };

      room.messages.push(newMessage);
      // Keep max 50 recent messages
      if (room.messages.length > 50) {
        room.messages = room.messages.slice(-50);
      }

      return NextResponse.json({ success: true, message: newMessage, room });
    }

    // 5. ACTION: HEARTBEAT
    if (action === "heartbeat") {
      if (memberId) {
        const member = room.members.find((m) => m.id === memberId);
        if (member) member.lastActive = now;
      }
      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[POST /api/music/rooms/[code]]", error);
    return NextResponse.json({ error: "Failed to process room action" }, { status: 500 });
  }
}

// DELETE /api/music/rooms/[code] — leave or close room
export async function DELETE(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code?.toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      return NextResponse.json({ success: true, message: "Room already closed" });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (memberId) {
      const leavingMember = room.members.find((m) => m.id === memberId);
      if (leavingMember) {
        // If host leaves, transfer host to next member or close room if empty
        if (leavingMember.isHost) {
          room.members = room.members.filter((m) => m.id !== memberId);
          if (room.members.length > 0) {
            room.members[0].isHost = true;
            room.hostId = room.members[0].id;
            room.hostName = room.members[0].name;
            room.messages.push({
              id: `msg_${Date.now()}`,
              sender: "System",
              text: `👑 ${room.members[0].name} is now the host of room #${code}.`,
              color: "#f59e0b",
              createdAt: Date.now(),
            });
          } else {
            rooms.delete(code);
            return NextResponse.json({ success: true, message: "Room closed" });
          }
        } else {
          room.members = room.members.filter((m) => m.id !== memberId);
          room.messages.push({
            id: `msg_${Date.now()}`,
            sender: "System",
            text: `👋 ${leavingMember.name} left the room.`,
            color: "#6b7280",
            createdAt: Date.now(),
          });
        }
      }
    }

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error("[DELETE /api/music/rooms/[code]]", error);
    return NextResponse.json({ error: "Failed to leave room" }, { status: 500 });
  }
}

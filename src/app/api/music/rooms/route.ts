import { NextRequest, NextResponse } from "next/server";

export interface RoomMember {
  id: string;
  name: string;
  isHost: boolean;
  color: string;
  lastActive: number;
}

export interface LiveReaction {
  id: string;
  emoji: string;
  sender: string;
  createdAt: number;
  x: number; // 0 to 100 percentage across screen
}

export interface RoomMessage {
  id: string;
  sender: string;
  text: string;
  color: string;
  createdAt: number;
}

export interface MusicRoom {
  code: string; // Exactly 5 uppercase chars
  hostId: string;
  hostName: string;
  trackId: string;
  isPlaying: boolean;
  currentTime: number;
  lastUpdated: number;
  members: RoomMember[];
  reactions: LiveReaction[];
  messages: RoomMessage[];
}

// In-memory room store (persists across API requests in Node/Next.js runtime)
declare global {
  // eslint-disable-next-line no-var
  var globalMusicRooms: Map<string, MusicRoom> | undefined;
}

const rooms = globalThis.globalMusicRooms || new Map<string, MusicRoom>();
globalThis.globalMusicRooms = rooms;

// Throttle cleanup to at most once per minute — rooms only go stale after an
// hour, so scanning the whole map on every single request is wasted work.
const CLEANUP_INTERVAL_MS = 60000;
declare global {
  // eslint-disable-next-line no-var
  var globalMusicRoomsLastCleanup: number | undefined;
}

// Helper to cleanup stale rooms (inactive for > 1 hour)
function cleanupStaleRooms() {
  const now = Date.now();
  const lastCleanup = globalThis.globalMusicRoomsLastCleanup || 0;
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }
  globalThis.globalMusicRoomsLastCleanup = now;

  for (const [code, room] of rooms.entries()) {
    if (now - room.lastUpdated > 3600000) {
      rooms.delete(code);
    }
  }
}

// Generate random 5-character alphanumeric room code
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous characters
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/music/rooms — list active rooms (public info)
export async function GET() {
  cleanupStaleRooms();
  const roomList = Array.from(rooms.values()).map((r) => ({
    code: r.code,
    hostName: r.hostName,
    memberCount: r.members.length,
    trackId: r.trackId,
    isPlaying: r.isPlaying,
  }));
  return NextResponse.json({ rooms: roomList });
}

// POST /api/music/rooms — create a new room
export async function POST(req: NextRequest) {
  try {
    cleanupStaleRooms();
    const body = await req.json();
    let { code } = body;
    const { hostName, hostId, trackId, isPlaying, currentTime } = body;

    if (!hostName) {
      return NextResponse.json({ error: "hostName is required" }, { status: 400 });
    }

    // If code is not provided or invalid, generate a 5-char code
    if (!code || typeof code !== "string" || code.trim().length !== 5) {
      do {
        code = generateRoomCode();
      } while (rooms.has(code));
    } else {
      code = code.trim().toUpperCase();
      if (!/^[A-Z0-9]{5}$/.test(code)) {
        return NextResponse.json(
          { error: "Room code must be exactly 5 alphanumeric characters (A-Z, 0-9)" },
          { status: 400 }
        );
      }
    }

    const memberId = hostId || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const colors = ["#a855f7", "#06b6d4", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"];
    const hostColor = colors[Math.floor(Math.random() * colors.length)];

    const newRoom: MusicRoom = {
      code,
      hostId: memberId,
      hostName: hostName.trim(),
      trackId: trackId || "",
      isPlaying: isPlaying || false,
      currentTime: currentTime || 0,
      lastUpdated: Date.now(),
      members: [
        {
          id: memberId,
          name: hostName.trim(),
          isHost: true,
          color: hostColor,
          lastActive: Date.now(),
        },
      ],
      reactions: [],
      messages: [
        {
          id: `msg_${Date.now()}`,
          sender: "System",
          text: `🎉 Room #${code} created by ${hostName}! Welcome everyone!`,
          color: "#06b6d4",
          createdAt: Date.now(),
        },
      ],
    };

    rooms.set(code, newRoom);

    return NextResponse.json({
      success: true,
      room: newRoom,
      memberId,
    });
  } catch (error) {
    console.error("[POST /api/music/rooms]", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}

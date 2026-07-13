import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes from './routes/auth';
import documentRoutes from './routes/document';
import DocumentModel from './models/Document';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const server = http.createServer(app);

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

const io = new Server(server, {
  cors: { origin: "http://localhost:3000" },
});

// ── Per-room user tracking ────────────────────────────────────────────────
// roomUsers: slug → Set of userIds (unique users per room)
const roomUsers = new Map<string, Map<string, string>>(); // slug → Map<userId, username>

// socketMeta: socketId → { slug, userId } so we know which room to clean up on disconnect
const socketMeta = new Map<string, { slug: string; userId: string }>();

// In-memory debounce per room: slug → timeout handle
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
const SAVE_DEBOUNCE_MS = 1000;

function getRoomUserList(slug: string): { userId: string; username: string }[] {
  const room = roomUsers.get(slug);
  if (!room) return [];
  return Array.from(room.entries()).map(([userId, username]) => ({ userId, username }));
}

function emitRoomUsers(slug: string) {
  const users = getRoomUserList(slug);
  io.to(slug).emit("room:users", {
    slug,
    count: users.length,
    users: users.map((u) => u.username),
  });
}

// Debounced DB persist — called from the doc:change handler
function scheduleSave(slug: string, lines: { index: number; content: string }[]) {
  if (saveTimers.has(slug)) clearTimeout(saveTimers.get(slug)!);

  saveTimers.set(
    slug,
    setTimeout(async () => {
      saveTimers.delete(slug);
      try {
        await DocumentModel.findOneAndUpdate(
          { slug },
          { $set: { lines } },
          { new: false }
        );
        console.log(`[${slug}] saved to DB`);
      } catch (err) {
        console.error(`[${slug}] DB save failed:`, err);
      }
    }, SAVE_DEBOUNCE_MS)
  );
}

// ── Socket.IO ─────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Client emits this when it opens a document page
  // payload: { slug, userId, username }
  socket.on("room:join", ({ slug, userId, username }: { slug: string; userId: string; username: string }) => {
    if (!slug || !userId) return;

    // Join the Socket.IO room for this document
    socket.join(slug);

    // Track metadata for cleanup on disconnect
    socketMeta.set(socket.id, { slug, userId });

    // Add user to the room's unique user map (keyed by userId → deduplicates tabs)
    if (!roomUsers.has(slug)) {
      roomUsers.set(slug, new Map());
    }
    roomUsers.get(slug)!.set(userId, username ?? userId);

    console.log(`[${slug}] ${username} (${userId}) joined`);

    // Notify everyone in the room (including the joiner) of the updated user list
    emitRoomUsers(slug);

    // Notify others
    socket.to(slug).emit("room:notification", {
      message: `${username} joined`,
      timestamp: Date.now(),
    });
  });

  // ── Document change ───────────────────────────────────────────────────────
  // Client emits this whenever content changes (debounced on client side).
  // payload: { slug, lines: Array<{ index, content }> }
  socket.on("doc:change", ({ slug, lines }: { slug: string; lines: { index: number; content: string }[] }) => {
    if (!slug || !Array.isArray(lines)) return;

    // Broadcast the updated content to everyone else in the room immediately
    socket.to(slug).emit("doc:update", { slug, lines });

    // Debounce the DB write — avoids a write per keystroke
    scheduleSave(slug, lines);
  });

  socket.on("disconnect", () => {
    const meta = socketMeta.get(socket.id);
    socketMeta.delete(socket.id);

    if (!meta) return;

    const { slug, userId } = meta;

    // Only remove the user from the room if they have no other sockets still in it
    // (handles multiple tabs: check if any other socket has the same userId in this room)
    const stillConnected = [...socketMeta.values()].some(
      (m) => m.slug === slug && m.userId === userId
    );

    if (!stillConnected) {
      const room = roomUsers.get(slug);
      if (room) {
        const username = room.get(userId);
        room.delete(userId);
        if (room.size === 0) roomUsers.delete(slug);

        console.log(`[${slug}] ${username ?? userId} left`);

        io.to(slug).emit("room:notification", {
          message: `${username ?? userId} left`,
          timestamp: Date.now(),
        });
      }
    }

    emitRoomUsers(slug);
  });
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

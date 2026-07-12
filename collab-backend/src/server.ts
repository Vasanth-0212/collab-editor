import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes  from './routes/auth'
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const server = http.createServer(app);

app.use('/api/auth', authRoutes);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
    },
});

let activeUsers = 0
const users: Record<string, string> = {};
let currentContent = "";

io.on("connection", (socket) => {
    activeUsers++;
    console.log("User connected:", socket.id);
    io.emit("active-users-count", activeUsers);

    socket.on("join", ({ username }) => {
        // Idempotent — ignore if this socket already joined
        if (users[socket.id]) return;

        users[socket.id] = username;
        console.log(`${username} joined (${socket.id})`);

        // broadcast to everyone, including sender
        io.emit("user-joined", { username, id: socket.id });

        // send current list of users to everyone
        io.emit("users-list", Object.values(users));
        
        // send notifications
        socket.broadcast.emit("notification", {
            message: `${username} joined the editor`,
            timestamp: Date.now(),
        });
    });

    // Send current content when the client is ready to receive it
    socket.on("request-content", () => {
        socket.emit("content-changed", { content: currentContent });
    });

    socket.on("content-changed", ({ content }) => {
        // Broadcast to everyone EXCEPT the sender
        currentContent = content; // ✅ Keep backend in sync
        socket.broadcast.emit("content-changed", { content });
    });

    socket.on("disconnect", () => {
        activeUsers--;
        const username = users[socket.id];
        delete users[socket.id];

        console.log("User disconnected:", socket.id);
        io.emit("active-users-count", activeUsers);

        if (username) {
            io.emit("user-left", { username, id: socket.id });
            io.emit("users-list", Object.values(users));
        }
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
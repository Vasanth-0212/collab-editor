import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(cors());

const server = http.createServer(app);

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

server.listen(5000, () => {
    console.log("Server running on port 5000");
});
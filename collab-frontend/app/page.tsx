"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "@/lib/socket";
import { toast } from "sonner";

export default function Home() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [open, setOpen] = useState(true);
  const [users, setUsers] = useState<string[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [content, setContent] = useState("");
  const isRemoteChange = useRef(false);
  const joinedRef = useRef(false);

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // Keep joinedRef in sync with joined state
  useEffect(() => {
    joinedRef.current = joined;
  }, [joined]);

  useEffect(() => {
    if (!joined) return;

    const handleActiveUsers = (count: number) => {
      setActiveUsers(count);
    };

    const handleUsers = (users: any) => {
      setUsers(users);
    };

    const handleContentChanged = ({ content }: { content: string }) => {
      isRemoteChange.current = true;
      setContent(content);
    };

    socket.on("users-list", handleUsers);
    socket.on("active-users-count", handleActiveUsers);
    socket.on("content-changed", handleContentChanged);
    socket.on("notification", (data) => {
      toast.info(data.message);
    });

    // Request the current content now that listener is ready
    socket.emit("request-content");

    return () => {
      socket.off("active-users-count", handleActiveUsers);
      socket.off("users-list", handleUsers);
      socket.off("content-changed", handleContentChanged);
    };
  }, [joined]);

  useEffect(() => {
    const handleClickOutside = () => setShowUsers(false);
    if (showUsers) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUsers]);

  // Only emit if change was from local user and they have joined
  useEffect(() => {
    if (!joinedRef.current) return;

    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }
    socket.emit("content-changed", { content: content.trim() });
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-screen">
      {joined && (
        <header className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm shrink-0">
          <h1 className="text-lg text-black/80 font-semibold">Collaborative Editor</h1>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Active Users: {activeUsers}
            </span>

            <div className="relative cursor-pointer">
              <button
                onClick={() => setShowUsers((prev) => !prev)}
                className="flex items-center -space-x-2"
              >
                {users.slice(0, 4).map((user, i) => (
                  <div
                    key={i}
                    title={user}
                    className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium border-2 border-white"
                  >
                    {user.charAt(0).toUpperCase()}
                  </div>
                ))}
                {users.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-medium border-2 border-white">
                    +{users.length - 4}
                  </div>
                )}
              </button>

              {showUsers && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50 py-2">
                  {users.map((user, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
                        {user.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-500">{user}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
            <h2 className="text-xl text-black font-semibold mb-1">Enter Your Name</h2>
            <p className="text-sm text-black mb-4">
              Choose a name to join the collaborative session.
            </p>

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && username.trim()) {
                  if (!socket.connected) socket.connect();
                  socket.emit("join", { username });
                  setJoined(true);
                  setOpen(false);
                }
              }}
              className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              disabled={!username.trim()}
              onClick={() => {
                if (!socket.connected) socket.connect();
                socket.emit("join", { username });
                setJoined(true);
                setOpen(false);
              }}
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Join
            </button>
          </div>
        </div>
      )}

      {joined && (
        <main className="flex-1 overflow-hidden">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing..."
            className="w-full h-full resize-none p-6 outline-none text-white text-lg"
          />
        </main>
      )}
    </div>
  );
}
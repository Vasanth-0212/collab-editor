"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { socket } from "@/lib/socket";
import { toast } from "sonner";
import AuthModal from "@/components/auth/AuthModal";

export default function Home() {
  const { data: session, status } = useSession();

  const [activeUsers, setActiveUsers] = useState(0);
  const [joined, setJoined] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [content, setContent] = useState("");
  const isRemoteChange = useRef(false);
  const joinedRef = useRef(false);

  // Auto-join once session is authenticated
  useEffect(() => {
    if (session?.user && !joined) {
      if (!socket.connected) socket.connect();
      socket.emit("join", { username: session.user.name ?? session.user.email });
      setJoined(true);
    }
  }, [session, joined]);

  useEffect(() => {
    joinedRef.current = joined;
  }, [joined]);

  useEffect(() => {
    if (!joined) return;

    const handleActiveUsers = (count: number) => setActiveUsers(count);
    const handleUsers = (list: string[]) => setUsers(list);
    const handleContentChanged = ({ content }: { content: string }) => {
      isRemoteChange.current = true;
      setContent(content);
    };

    socket.on("users-list", handleUsers);
    socket.on("active-users-count", handleActiveUsers);
    socket.on("content-changed", handleContentChanged);
    socket.on("notification", (data) => toast.info(data.message));

    socket.emit("request-content");

    return () => {
      socket.off("active-users-count", handleActiveUsers);
      socket.off("users-list", handleUsers);
      socket.off("content-changed", handleContentChanged);
    };
  }, [joined]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowUsers(false);
      setShowUserMenu(false);
    };
    if (showUsers || showUserMenu) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUsers, showUserMenu]);

  useEffect(() => {
    if (!joinedRef.current) return;
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }
    socket.emit("content-changed", { content: content.trim() });
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show auth modal while loading or unauthenticated
  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
        <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthModal />;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm shrink-0">
        <h1 className="text-lg text-black/80 font-semibold">Collaborative Editor</h1>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Active Users: {activeUsers}</span>

          {/* Active users avatars */}
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
                  <div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
                      {user.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-500">{user}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Signed-in user menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="flex items-center gap-2 rounded-full hover:bg-gray-100 pl-1 pr-3 py-1 transition"
              title={session.user?.name ?? session.user?.email ?? "Account"}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                {(session.user?.name ?? session.user?.email ?? "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 max-w-[120px] truncate hidden sm:block">
                {session.user?.name ?? session.user?.email}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border rounded-lg shadow-lg z-50 py-1">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    socket.disconnect();
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  {/* Logout icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing…"
          className="w-full h-full resize-none p-6 outline-none text-white text-lg"
        />
      </main>
    </div>
  );
}

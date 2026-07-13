"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { socket } from "@/lib/socket";
import { useEditor } from "@/providers/EditorProvider";

export default function Navbar() {
  const { data: session } = useSession();
  const { activeUsers, users } = useEditor();

  const [showUsers, setShowUsers] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const usersRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (usersRef.current && !usersRef.current.contains(e.target as Node)) {
        setShowUsers(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // stable — no deps that change size

  // Don't render the header until the user is authenticated
  if (!session) return null;

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm shrink-0">
      <h1 className="text-lg text-black/80 font-semibold">Collaborative Editor</h1>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Active Users: {activeUsers}</span>

        {/* Active users avatars */}
        <div className="relative" ref={usersRef}>
          <button
            onClick={() => setShowUsers((prev) => !prev)}
            className="flex items-center -space-x-2"
            aria-label="Show active users"
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
        <div className="relative" ref={menuRef}>
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
                className="w-full flex items-center cursor-pointer gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
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
  );
}

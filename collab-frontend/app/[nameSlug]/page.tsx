"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import AuthModal from "@/components/auth/AuthModal";
import { socket } from "@/lib/socket";
import { useEditor } from "@/providers/EditorProvider";
import {
  fetchDocument,
  createDocument,
  type Line,
} from "@/actions/document";

const EMIT_DEBOUNCE_MS = 300; // emit doc:change 300 ms after user stops typing

// Convert flat textarea string → Line array
function textToLines(text: string): Line[] {
  return text.split("\n").map((content, index) => ({ index, content }));
}

// Convert Line array → flat textarea string
function linesToText(lines: Line[]): string {
  return [...lines].sort((a, b) => a.index - b.index).map((l) => l.content).join("\n");
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function DocumentPage() {
  const params = useParams();
  const slug = (params?.nameSlug as string) ?? "";

  const { data: session, status } = useSession();
  const { setActiveUsers, setUsers } = useEditor();

  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loading, setLoading] = useState(true);

  // Refs to avoid stale closures and prevent feedback loops
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContent = useRef(content);
  const isRemoteChange = useRef(false); // true when content is set from a remote doc:update

  useEffect(() => {
    latestContent.current = content;
  }, [content]);

  // ── Socket room: join + presence ──────────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated" || !slug) return;

    const userId = (session.user as { id?: string }).id ?? "";
    const username = session.user?.name ?? session.user?.email ?? userId;

    if (!socket.connected) socket.connect();
    socket.emit("room:join", { slug, userId, username });

    const handleRoomUsers = (data: { count: number; users: string[] }) => {
      setActiveUsers(data.count);
      setUsers(data.users);
    };

    const handleNotification = (data: { message: string }) => {
      toast.info(data.message);
    };

    socket.on("room:users", handleRoomUsers);
    socket.on("room:notification", handleNotification);

    return () => {
      socket.off("room:users", handleRoomUsers);
      socket.off("room:notification", handleNotification);
      setActiveUsers(0);
      setUsers([]);
    };
  }, [status, slug, session, setActiveUsers, setUsers]);

  // ── Socket: receive remote document updates ───────────────────────────────
  useEffect(() => {
    if (!slug) return;

    const handleDocUpdate = (data: { slug: string; lines: Line[] }) => {
      if (data.slug !== slug) return;
      // Mark as remote so the emit effect below doesn't re-broadcast
      isRemoteChange.current = true;
      setContent(linesToText(data.lines));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    };

    socket.on("doc:update", handleDocUpdate);
    return () => socket.off("doc:update", handleDocUpdate);
  }, [slug]);

  // ── Emit doc:change on local edits (debounced) ────────────────────────────
  const emitChange = useCallback(() => {
    if (!slug) return;
    setSaveStatus("saving");
    const lines = textToLines(latestContent.current);
    socket.emit("doc:change", { slug, lines });
    // Optimistically mark as saved — server will persist asynchronously
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  }, [slug]);

  useEffect(() => {
    if (loading || status !== "authenticated") return;

    // Skip emit if the change came from a remote update
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(emitChange, EMIT_DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [content, loading, status, emitChange]);

  // ── Ctrl+S: force immediate emit ─────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        emitChange();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [emitChange]);

  // ── Load or create document on mount ──────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated" || !slug) return;

    const userId = (session.user as { id?: string }).id ?? "";

    async function init() {
      setLoading(true);
      let doc = await fetchDocument(slug);

      if (!doc) {
        doc = await createDocument(slug, userId);
        if (!doc) {
          toast.error("Could not create document");
          setLoading(false);
          return;
        }
      }

      // Mark as remote so initial load doesn't trigger an emit
      isRemoteChange.current = true;
      setContent(linesToText(doc.lines));
      setLoading(false);
    }

    init();
  }, [status, slug, session]);

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
        <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthModal />;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-col flex-1 h-[calc(100vh-49px)]">
      {/* Save status badge */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-1.5 text-xs text-gray-400 select-none">
        {saveStatus === "saving" && (
          <>
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Saving…
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Saved
          </>
        )}
        {saveStatus === "error" && (
          <>
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Save failed
          </>
        )}
        {saveStatus === "idle" && (
          <span className="text-gray-500/50">Ctrl+S to save</span>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing…"
          spellCheck={false}
          className="flex-1 w-full resize-none p-6 outline-none bg-transparent text-black/50 text-lg leading-relaxed font-mono"
        />
      )}
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";
import AuthModal from "@/components/auth/AuthModal";

export default function Home() {
  const { data: session, status } = useSession();

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

  // Authenticated users land here momentarily before being redirected
  // to a document slug by LoginForm / SignUpForm.
  return null;
}

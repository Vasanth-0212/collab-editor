"use client";

import { useAuthModal } from "@/hooks/useAuthModal";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import GoogleButton from "./GoogleButton";

export default function AuthModal() {
  const { tab, setTab } = useAuthModal();

  return (
    // Fixed overlay — no close button, always on top
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Collaborative Editor</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to start collaborating</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
              tab === "login"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
              tab === "signup"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Google OAuth */}
        <GoogleButton />

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Credential forms */}
        {tab === "login" ? (
          <LoginForm onSwitch={() => setTab("signup")} />
        ) : (
          <SignUpForm onSwitch={() => setTab("login")} />
        )}
      </div>
    </div>
  );
}

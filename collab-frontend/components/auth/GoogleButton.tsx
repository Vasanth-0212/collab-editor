"use client";

import { signIn } from "next-auth/react";

export default function GoogleButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/" })}
      className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
    >
      {/* Google "G" logo */}
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M47.53 24.56c0-1.62-.15-3.18-.42-4.68H24v9.02h13.2a11.3 11.3 0 0 1-4.9 7.4v6.15h7.93c4.64-4.28 7.3-10.6 7.3-17.9z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.6 0 12.14-2.18 16.19-5.9l-7.93-6.16c-2.2 1.48-5.01 2.35-8.26 2.35-6.35 0-11.73-4.29-13.65-10.05H2.15v6.36A24 24 0 0 0 24 48z"
        />
        <path
          fill="#FBBC05"
          d="M10.35 28.24A14.37 14.37 0 0 1 9.6 24c0-1.48.25-2.91.75-4.24v-6.36H2.15A24.01 24.01 0 0 0 0 24c0 3.87.93 7.53 2.15 10.6l8.2-6.36z"
        />
        <path
          fill="#EA4335"
          d="M24 9.71c3.58 0 6.79 1.23 9.32 3.65l6.98-6.98C36.13 2.42 30.59 0 24 0A24 24 0 0 0 2.15 13.4l8.2 6.36C12.27 14 17.65 9.71 24 9.71z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

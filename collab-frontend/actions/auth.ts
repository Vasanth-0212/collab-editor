"use server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    return {
      success: data.success ?? false,
      message: data.message ?? "Something went wrong",
    };
  } catch {
    return { success: false, message: "Could not reach the server" };
  }
}

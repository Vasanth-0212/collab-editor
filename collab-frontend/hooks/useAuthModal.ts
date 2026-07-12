import { useState } from "react";

export type AuthTab = "login" | "signup";

export function useAuthModal(initial: AuthTab = "login") {
  const [tab, setTab] = useState<AuthTab>(initial);
  return { tab, setTab };
}

"use client";
import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ExtensionSync() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const EXTENSION_ID = "fnobdehmfmohbmdbdagpkacigocmldjj"; // Ton ID actuel

  useEffect(() => {
    if (session && typeof window !== "undefined" && window.chrome?.runtime) {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          type: "FUKI_AUTH_SUCCESS",
          session: session,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.log("Extension non détectée ou ID erroné.");
          } else {
            console.log("✅ Synchro réussie !");
            window.postMessage({ type: "FUKI_SYNC_CONFIRMED" }, "*");
          }
        },
      );
    }
  }, [session, pathname]);

  return null;
}

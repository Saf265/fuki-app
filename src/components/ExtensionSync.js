"use client";
import { authClient } from "@/lib/auth-client"; // Ton fichier config better-auth
import { useEffect } from "react";

export default function ExtensionSync() {
  const { data: session } = authClient.useSession();
  const EXTENSION_ID = "fnobdehmfmohbmdbdagpkacigocmldjj"; // À copier depuis chrome://extensions

  useEffect(() => {
    // Si une session existe et qu'on détecte l'extension
    if (session && typeof window !== "undefined" && window.chrome?.runtime) {
      try {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          {
            type: "FUKI_AUTH_SUCCESS",
            session: session,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.log("L'extension n'est pas installée ou l'ID est faux.");
            } else {
              console.log("Synchronisation avec l'extension réussie !");
            }
          },
        );
      } catch (e) {
        console.error("Erreur de synchro extension:", e);
      }
    }
  }, [session]);

  return null; // Le composant ne rend rien visuellement
}

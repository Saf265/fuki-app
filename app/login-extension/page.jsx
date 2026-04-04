"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/src/lib/auth-client";
import { CheckCircle2, Loader2, Lock } from "lucide-react";

export default function LoginExtension() {
  const { data: session, isPending } = authClient.useSession();
  const [status, setStatus] = useState("checking"); // 'checking', 'unauthenticated', 'authenticated', 'sending', 'sent', 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      setStatus("unauthenticated");
    } else {
      handleSendToken();
    }
  }, [session, isPending]);

  async function handleSendToken() {
    setStatus("sending");
    try {
      // @ts-ignore
      const { data, error: tokenError } = await authClient.token();
      if (tokenError) throw tokenError;

      if (data?.token) {
        // Envoie le token à l'extension
        window.postMessage({ type: "EXTENSION_LOGIN", token: data.token }, "*");
        setStatus("sent");
        
        // Optionnel: fermer l'onglet après un court délai si c'est une popup
        // setTimeout(() => window.close(), 2000);
      } else {
        throw new Error("Aucun token récupéré");
      }
    } catch (err) {
      console.error("Erreur login extension:", err);
      setError(err.message);
      setStatus("error");
    }
  }

  const handleLogin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/login-extension",
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fafafa] p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-10 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
            {status === "sent" ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-in zoom-in duration-300" />
            ) : status === "error" ? (
              <Lock className="w-10 h-10 text-rose-500" />
            ) : (
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            )}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {status === "checking" && "Vérification..."}
              {status === "unauthenticated" && "Connexion requise"}
              {status === "sending" && "Synchronisation..."}
              {status === "sent" && "Extension connectée !"}
              {status === "error" && "Oups ! Une erreur"}
            </h1>
            <p className="text-gray-500 font-medium">
              {status === "checking" && "Nous vérifions votre session actuelle."}
              {status === "unauthenticated" && "Connectez-vous pour autoriser l'extension Fuki."}
              {status === "sending" && "Nous envoyons vos accès sécurisés à l'extension."}
              {status === "sent" && "Votre extension est maintenant prête à l'emploi. Vous pouvez fermer cet onglet."}
              {status === "error" && (error || "Impossible de récupérer le token d'accès.")}
            </p>
          </div>
        </div>

        {status === "unauthenticated" && (
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
          >
            <GoogleIcon />
            Continuer avec Google
          </button>
        )}

        {status === "sent" && (
          <button
            onClick={() => window.close()}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-semibold hover:bg-emerald-600 transition-all active:scale-[0.98] shadow-lg shadow-emerald-100"
          >
            Fermer l&apos;onglet
          </button>
        )}

        {status === "error" && (
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-semibold hover:bg-gray-200 transition-all"
          >
            Réessayer
          </button>
        )}

        <div className="pt-4 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-300">Fuki Security</span>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

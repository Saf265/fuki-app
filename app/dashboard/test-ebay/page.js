"use client";

import { useState } from "react";
import { Sidebar } from "../page";

export default function TestEbay() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ebay/test-token");
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Une erreur est survenue");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar active="connections" />

      <main
        className="flex-1 transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: "var(--sidebar-w, 16rem)" }}
      >
        <div className="px-10 pt-10 pb-8 border-b border-border">
          <h1 className="text-xl font-semibold tracking-tight">Test eBay Token</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Testez le refresh automatique du token eBay
          </p>
        </div>

        <div className="p-10">
          <div className="max-w-2xl">
            <button
              onClick={testToken}
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Test en cours..." : "Tester le token"}
            </button>

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 font-semibold">Erreur</p>
                <p className="text-sm text-red-400 mt-1">{error}</p>
              </div>
            )}

            {result && (
              <div className="mt-6 p-6 bg-card border border-border rounded-lg">
                <p className="text-green-500 font-semibold mb-4">✓ Token valide !</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Connection ID:</span>
                    <p className="font-mono mt-1">{result.connectionId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Token (preview):</span>
                    <p className="font-mono mt-1 break-all">{result.tokenPreview}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Message:</span>
                    <p className="mt-1">{result.message}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 p-6 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-3">Comment ça fonctionne ?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Le système vérifie si le token expire dans moins de 5 minutes</li>
                <li>• Si oui, il utilise le refresh_token pour obtenir un nouveau access_token</li>
                <li>• La base de données est automatiquement mise à jour</li>
                <li>• Vous recevez toujours un token valide</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

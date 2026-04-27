"use client";

import { useState } from "react";
import { Sidebar } from "../page";

export default function TestEbayMessages() {
  const [testType, setTestType] = useState("conversations");
  const [conversationId, setConversationId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testConversations = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/messages");
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

  const testMessages = async () => {
    if (!conversationId.trim()) {
      setError("Veuillez entrer un ID de conversation");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/messages/${conversationId}?platform=ebay`);
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
          <h1 className="text-xl font-semibold tracking-tight">Test eBay Messages API</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Testez les appels API eBay pour les conversations et messages
          </p>
        </div>

        <div className="p-10">
          <div className="max-w-3xl space-y-6">
            {/* Test type selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de test</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTestType("conversations")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${testType === "conversations"
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Liste des conversations
                </button>
                <button
                  onClick={() => setTestType("messages")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${testType === "messages"
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Messages d'une conversation
                </button>
              </div>
            </div>

            {/* Conversation ID input (only for messages test) */}
            {testType === "messages" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">ID de conversation eBay</label>
                <input
                  type="text"
                  value={conversationId}
                  onChange={(e) => setConversationId(e.target.value)}
                  placeholder="Ex: 5***1234567890***1"
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Format eBay: 5***[numéros]***1
                </p>
              </div>
            )}

            {/* Test button */}
            <button
              onClick={testType === "conversations" ? testConversations : testMessages}
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Test en cours..." : "Lancer le test"}
            </button>

            {/* Error display */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 font-semibold">Erreur</p>
                <p className="text-sm text-red-400 mt-1">{error}</p>
              </div>
            )}

            {/* Result display */}
            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-500 font-semibold">✓ Succès !</p>
                </div>

                {/* Summary */}
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h3 className="font-semibold mb-3">Résumé</h3>
                  {testType === "conversations" ? (
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Comptes trouvés:</span>{" "}
                        <span className="font-mono">{result.accounts?.length || 0}</span>
                      </p>
                      {result.accounts?.map((account, i) => (
                        <div key={i} className="pl-4 border-l-2 border-border">
                          <p className="font-medium">{account.username}</p>
                          <p className="text-muted-foreground">
                            Plateforme: {account.platform} | Conversations: {account.conversations?.length || 0}
                          </p>
                        </div>
                      ))}
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-2 p-2 bg-red-500/10 rounded">
                          <p className="text-red-500 text-xs font-semibold">Erreurs:</p>
                          {result.errors.map((err, i) => (
                            <p key={i} className="text-xs text-red-400">{err}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Conversation ID:</span>{" "}
                        <span className="font-mono">{result.conversationId}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Titre:</span>{" "}
                        {result.conversationTitle || "N/A"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Statut:</span>{" "}
                        {result.conversationStatus || "N/A"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Messages:</span>{" "}
                        <span className="font-mono">{result.messages?.length || 0}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Plateforme:</span>{" "}
                        {result.platform}
                      </p>
                    </div>
                  )}
                </div>

                {/* Raw JSON */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Réponse brute (JSON)</h3>
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Info box */}
            <div className="p-6 bg-muted/30 rounded-lg space-y-3">
              <h3 className="font-semibold">ℹ️ Informations</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Sandbox eBay:</strong> En mode sandbox, vous n'aurez probablement pas de vraies conversations.
                </p>
                <p>
                  <strong>Test des conversations:</strong> Appelle <code className="px-1 py-0.5 bg-muted rounded text-xs">/api/messages</code> pour récupérer toutes les conversations (Vinted + eBay).
                </p>
                <p>
                  <strong>Test des messages:</strong> Appelle <code className="px-1 py-0.5 bg-muted rounded text-xs">/api/messages/[id]?platform=ebay</code> pour récupérer les messages d'une conversation spécifique.
                </p>
                <p>
                  <strong>Logs:</strong> Regardez la console de votre terminal pour voir tous les logs détaillés des appels API.
                </p>
              </div>
            </div>

            {/* Expected responses */}
            <div className="p-6 bg-card border border-border rounded-lg space-y-3">
              <h3 className="font-semibold">Réponses attendues</h3>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium mb-2">Si aucune conversation eBay:</p>
                  <pre className="p-3 bg-muted rounded text-xs overflow-auto">
                    {`{
  "accounts": [
    {
      "accountId": "...",
      "username": "eBay Sandbox User",
      "platform": "ebay",
      "conversations": [],
      "hasMore": false,
      "pagination": {
        "total": 0,
        "limit": 10,
        "offset": 0
      }
    }
  ]
}`}
                  </pre>
                </div>

                <div>
                  <p className="font-medium mb-2">Si conversations eBay trouvées:</p>
                  <pre className="p-3 bg-muted rounded text-xs overflow-auto">
                    {`{
  "accounts": [
    {
      "accountId": "...",
      "username": "eBay Sandbox User",
      "platform": "ebay",
      "conversations": [
        {
          "conversationId": "5***123***1",
          "conversationTitle": "Question about item",
          "conversationStatus": "ACTIVE",
          "unreadCount": 2,
          "latestMessage": {...}
        }
      ]
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

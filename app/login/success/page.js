"use client";
import { CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LoginSuccessPage() {
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "FUKI_SYNC_CONFIRMED") {
        setSynced(true);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      <Link href="/" className="p-8 font-black text-2xl tracking-tighter">
        Fuki
      </Link>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md border-2 border-gray-50 p-12 text-center space-y-8 rounded-[2.5rem] shadow-xl">
          <div className="relative mx-auto w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle2
              className={`w-12 h-12 ${synced ? "text-emerald-500" : "text-gray-300"}`}
            />
          </div>
          <h1 className="text-3xl font-black">
            {synced ? "Synchronisé !" : "Finalisation..."}
          </h1>
          <p className="text-gray-500">Votre extension Fuki est prête.</p>
          <div className="bg-gray-50 p-6 rounded-2xl flex items-center justify-center gap-3 font-bold">
            <X className="w-4 h-4 text-rose-500" />
            <span>Vous pouvez fermer cet onglet</span>
          </div>
        </div>
      </div>
    </div>
  );
}

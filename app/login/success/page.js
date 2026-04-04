import { CheckCircle2, X } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Connexion réussie | Fuki",
};

export default function LoginSuccessPage() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      {/* Top Left Logo */}
      <Link href="/" className="p-8">
        <span className="text-2xl font-black text-gray-900 tracking-tighter">
          Fuki
        </span>
      </Link>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] border-2 border-gray-50 p-12 text-center space-y-8 shadow-2xl shadow-emerald-500/5 animate-in fade-in zoom-in duration-700">
          {/* Animated Success Icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full animate-pulse" />
            <div className="relative w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-xl shadow-emerald-100">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-in zoom-in duration-500" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
              Tout est prêt !
            </h1>
            <p className="text-gray-500 font-medium leading-relaxed">
              Votre extension Fuki est maintenant synchronisée et prête à automatiser votre business.
            </p>
          </div>

          <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100/50">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              Action requise
            </p>
            <div className="flex items-center justify-center gap-3 text-gray-900 font-bold bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
              <X className="w-4 h-4 text-rose-500" />
              <span>Vous pouvez fermer cet onglet</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 font-medium pt-4">
            Besoin d&apos;aide ? <Link href="/support" className="text-emerald-500 font-bold hover:underline">Contactez le support</Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 text-center text-xs text-gray-300 font-bold uppercase tracking-widest">
        Fuki Cloud Workspace
      </div>
    </div>
  );
}

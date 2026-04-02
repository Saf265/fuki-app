import { DoorOpen } from "lucide-react";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Connexion | Fuki",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      {/* Top Left Logo */}
      <Link href="/" className="p-8">
        <span className="text-2xl font-black text-gray-900 tracking-tighter">
          Fuki
        </span>
      </Link>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Header Section with Icon */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 flex items-center justify-center">
              <DoorOpen className="w-10 h-10 text-blue-600" strokeWidth={2.5} />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Se connecter
              </h1>
              <p className="text-gray-500 max-w-[300px] mx-auto font-medium">
                Automatisez vos annonces Vinted &amp; eBay en quelques clics.
              </p>
            </div>
          </div>

          <LoginForm />
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 flex justify-between items-center text-xs text-gray-400">
        <p>© 2026 Fuki</p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-gray-600 transition-colors">
            Conditions d&apos;utilisation
          </Link>
          <Link
            href="/privacy"
            className="hover:text-gray-600 transition-colors"
          >
            Confidentialité
          </Link>
        </div>
      </div>
    </div>
  );
}

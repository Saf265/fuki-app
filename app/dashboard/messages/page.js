'use client';

import { MessageSquare } from 'lucide-react';
import { Sidebar } from '../page';

export default function Messages() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar active="messages" />

      <main
        className="flex-1 flex items-center justify-center transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft: 'var(--sidebar-w, 16rem)' }}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4 shadow-sm">
            <MessageSquare size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Messagerie</h1>
          <p className="text-sm text-gray-400">Cette section est en cours de développement.</p>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  CheckCircle2,
  Clock,
  Store,
  ShoppingBag,
  Paperclip,
  Smile,
  Tag,
  Loader2,
  User,
  ExternalLink
} from 'lucide-react';
import { Sidebar } from '../page';

const PLATFORM_ICONS = {
  ebay: <Store size={14} className="text-blue-500" />,
  vinted: <ShoppingBag size={14} className="text-emerald-500" />
};

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/messages');
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
          if (data.conversations?.length > 0) {
            setActiveId(data.conversations[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeId) {
      const conv = conversations.find(c => c.id === activeId);
      setMessages(conv?.messages || []);
    }
  }, [activeId, conversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const activeConv = conversations.find(c => c.id === activeId);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    // Optimistic update
    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'me',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText("");

    try {
      const res = await fetch(`/api/messages/${activeId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      
      setMessages(prev => prev.map(m => 
        m.id === newMessage.id ? { ...m, status: 'sent' } : m
      ));
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans overflow-hidden">
      <Sidebar active="messages" />

      <main className="flex-1 ml-64 flex overflow-hidden">
        {/* Left: Conversations List */}
        <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="p-4 border-b border-gray-100 bg-white">
            <h1 className="text-xl font-bold mb-4">Messagerie</h1>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
                <span className="text-xs">Chargement des messages...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-sm">Aucune conversation trouvée.</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`w-full p-4 flex gap-3 text-left transition-all hover:bg-white border-b border-gray-100 relative ${activeId === conv.id ? 'bg-white shadow-sm z-10' : ''}`}
                >
                  {activeId === conv.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                  )}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold overflow-hidden shadow-inner">
                      {conv.avatar ? <img src={conv.avatar} alt="" /> : <User size={20} />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                      {PLATFORM_ICONS[conv.platform]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h3 className="text-sm font-bold truncate text-gray-900">{conv.name}</h3>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{conv.lastTime}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate leading-relaxed">
                      {conv.lastMessage}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-gray-300">
                        {conv.accountName}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        <div className="flex-1 flex flex-col bg-white relative">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="px-6 py-[18px] border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                    {activeConv.avatar ? <img src={activeConv.avatar} alt="" /> : <User size={18} />}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold flex items-center gap-2">
                      {activeConv.name}
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded mt-0.5 border border-gray-100 w-fit">
                      {PLATFORM_ICONS[activeConv.platform]}
                      <span className="font-medium">{activeConv.accountName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
                    <Tag size={14} />
                    Faire une offre
                  </button>
                  <div className="w-px h-6 bg-gray-100 mx-2" />
                  <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50">
                    <Info size={18} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5"
              >
                {messages.map((m, idx) => (
                  <div key={m.id || idx} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] group`}>
                      <div className={`
                        px-4 py-2.5 rounded-2xl text-sm relative shadow-sm
                        ${m.sender === 'me' 
                          ? 'bg-emerald-500 text-white rounded-br-none' 
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'}
                      `}>
                        {m.text}
                      </div>
                      <div className={`flex items-center gap-1.5 mt-1 ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-gray-300 font-medium">{m.time}</span>
                        {m.sender === 'me' && (
                          m.status === 'sent' ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Clock size={10} className="text-gray-300 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="relative flex items-end gap-3">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:border-emerald-500/50 transition-all flex flex-col">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="w-full bg-transparent border-none outline-none resize-none px-3 py-2 text-sm text-gray-800 min-h-[44px] max-h-32"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <div className="flex items-center justify-between px-2 pb-1">
                      <div className="flex items-center gap-1">
                        <button type="button" className="p-2 text-gray-400 hover:text-emerald-500 transition-colors rounded-lg">
                          <Smile size={18} />
                        </button>
                        <button type="button" className="p-2 text-gray-400 hover:text-emerald-500 transition-colors rounded-lg">
                          <Paperclip size={18} />
                        </button>
                      </div>
                      <button 
                        type="submit"
                        disabled={!inputText.trim() || isSending}
                        className="p-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                      >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
              <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-200 mb-6 shadow-xl">
                <Send size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Vos messages</h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Sélectionnez une conversation pour commencer à discuter avec vos acheteurs sur eBay et Vinted.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

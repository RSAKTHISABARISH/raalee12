import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../layout/Sidebar';
import { sendChatMessage, getUser } from '../../lib/api';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  ticket?: any;
}

// Professional OpenAI / ChatGPT Logo SVG
function ChatGptIcon({ className = 'w-5 h-5 text-white' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5973 8.3829l2.02-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4018-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.1802 1.6323zM8.3107 12.8698v-2.3371l5.838-3.3685 2.0154 1.1638v6.7369a.7854.7854 0 0 0 .3927.6813l-5.838 3.3685-2.4081-1.3897v-4.8552z" />
    </svg>
  );
}

const QUICK_PROMPTS = [
  { emoji: '🔑', label: 'Password Reset', prompt: 'I need to reset my corporate password' },
  { emoji: '🌐', label: 'VPN Help', prompt: 'My VPN connection keeps dropping' },
  { emoji: '💻', label: 'Monitor Issue', prompt: 'My external monitor is not detected' },
  { emoji: '📦', label: 'Software Access', prompt: 'I need access to GitHub and AWS' },
  { emoji: '🖨️', label: 'Printer Setup', prompt: 'How do I connect to the office printer?' },
  { emoji: '📧', label: 'Email Problem', prompt: 'My Outlook email is not syncing' },
  { emoji: '🎫', label: 'My Tickets', prompt: 'Show me my open tickets' },
  { emoji: '⏱️', label: 'SLA Info', prompt: 'What are the support SLA response times?' },
];

function renderFormattedText(raw: string) {
  const lines = raw.split('\n');
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1" />;
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-base text-white mt-3 mb-1">
              {line.replace('### ', '')}
            </h4>
          );
        }
        if (line.startsWith('• ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-[#10A37F] font-bold mt-0.5">•</span>
              <span>{renderInline(line.replace('• ', ''))}</span>
            </div>
          );
        }
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^(\d+\.)\s/)?.[1];
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="font-bold text-[#10A37F] mt-0.5">{num}</span>
              <span>{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
            </div>
          );
        }
        if (line.startsWith('```')) return null;
        return <p key={idx}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(str: string) {
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const parts: any[] = [];
  let lastIdx = 0;
  let match;
  while ((match = linkRegex.exec(str)) !== null) {
    if (match.index > lastIdx) parts.push(str.substring(lastIdx, match.index));
    parts.push(
      <a key={match.index} href={match[2]}
        className="font-bold text-[#10A37F] hover:text-[#0d8265] underline inline-flex items-center gap-0.5">
        {match[1]} →
      </a>
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < str.length) parts.push(str.substring(lastIdx));

  return parts.map((part, pIdx) => {
    if (typeof part !== 'string') return part;
    const boldParts = part.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={pIdx}>
        {boldParts.map((b, bIdx) =>
          bIdx % 2 === 1 ? <strong key={bIdx} className="font-semibold text-white">{b}</strong> : b
        )}
      </span>
    );
  });
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const user = getUser();

  useEffect(() => {
    if (!user) { window.location.href = '/'; return; }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    if (!started) setStarted(true);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(query);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.reply || 'I am ready to help you with any IT question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: res.suggestedActions,
        ticket: res.ticket,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `I had trouble connecting to the knowledge base. Please ensure you are logged in and try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setStarted(false);
  };

  return (
    <div className="min-h-screen portal-bg flex">
      <Sidebar currentPage="chat" />
      <main className="lg:ml-64 flex-1 flex flex-col h-screen">
        {/* Top Header Bar */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10A37F] flex items-center justify-center shadow-lg shadow-[#10A37F]/30">
              <ChatGptIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                HelpDesk 360 AI Assistant
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#10A37F]/20 text-[#10A37F] rounded font-bold uppercase border border-[#10A37F]/30">ITSM</span>
              </h1>
              <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Online · Enterprise Virtual Agent · Instant Answers
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-white/50 hover:text-white/80 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              New Chat
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {!started ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#10A37F] flex items-center justify-center shadow-xl shadow-[#10A37F]/30 mb-5">
                <ChatGptIcon className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Hello, {user?.name?.split(' ')[0] || 'there'}! 👋
              </h2>
              <p className="text-white/60 text-sm max-w-md mb-10">
                I'm your HelpDesk 360 AI Assistant. I can help with IT support, ticket lookups, troubleshooting guides, and more.
              </p>

              {/* Quick prompt grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl">
                {QUICK_PROMPTS.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qp.prompt)}
                    className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-2xl">{qp.emoji}</span>
                    <span className="text-xs font-semibold text-white/80 group-hover:text-white leading-tight">{qp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-4 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  {m.sender === 'bot' ? (
                    <div className="w-8 h-8 rounded-xl bg-[#10A37F] flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-[#10A37F]/30">
                      <ChatGptIcon className="w-4.5 h-4.5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[80%] ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    {m.sender === 'user' ? (
                      <div className="bg-[#10A37F] text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
                        <p className="text-sm leading-relaxed">{m.text}</p>
                      </div>
                    ) : (
                      <div className="bg-white/10 border border-white/15 text-white/90 rounded-2xl rounded-tl-sm px-5 py-4 shadow-md backdrop-blur-sm">
                        {renderFormattedText(m.text)}

                        {/* Embedded Ticket Card */}
                        {m.ticket && (
                          <div className="mt-4 p-3 bg-white/10 border border-white/15 rounded-xl text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">Incident #{m.ticket.id}</span>
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[11px]">
                                {m.ticket.status}
                              </span>
                            </div>
                            <p className="text-white/60 line-clamp-1">{m.ticket.title}</p>
                            <a href={`/tickets/${m.ticket.id}`}
                              className="inline-flex items-center gap-1 font-bold text-[#10A37F] hover:underline">
                              Open Ticket Details →
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <span className="text-[11px] text-white/30 mt-1.5 px-1">{m.timestamp}</span>

                    {/* Suggested Actions */}
                    {m.suggestedActions && m.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {m.suggestedActions.map((action, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => sendMessage(action)}
                            className="text-[12px] font-semibold bg-white/5 hover:bg-[#10A37F]/20 text-[#10A37F] border border-[#10A37F]/30 hover:border-[#10A37F]/60 px-3 py-1.5 rounded-full transition-all cursor-pointer"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-[#10A37F] flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-[#10A37F]/30">
                    <ChatGptIcon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="bg-white/10 border border-white/15 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10A37F] animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-[#10A37F] animate-bounce [animation-delay:0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-[#10A37F] animate-bounce [animation-delay:0.3s]" />
                    <span className="text-xs text-white/40 ml-2">AI is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-white/10 bg-black/20 backdrop-blur-md">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask IT support anything — tickets, passwords, VPN, hardware..."
                className="w-full pl-5 pr-14 py-4 bg-white/10 border border-white/20 hover:border-white/30 focus:border-[#10A37F]/60 rounded-2xl text-sm text-white placeholder-white/30 focus:outline-none transition-all backdrop-blur-sm"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="absolute right-2 p-2.5 bg-[#10A37F] hover:bg-[#0e8f6e] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[11px] text-white/25 mt-2.5 flex items-center justify-center gap-1">
              <ChatGptIcon className="w-3 h-3 text-[#10A37F]" />
              HelpDesk 360 AI · Powered by enterprise ITSM knowledge base
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

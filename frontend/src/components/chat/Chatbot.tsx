import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getUser } from '../../lib/api';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  ticket?: any;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getUser();

  useEffect(() => {
    // Initial welcome message
    const initialGreeting: Message = {
      id: 'welcome-1',
      sender: 'bot',
      text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! 👋 I am your **HelpDesk 360 AI Assistant**.\n\nI can answer IT support questions, troubleshoot VPN/passwords, or check the live telemetry of your tickets.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        '🎫 Check Ticket #152',
        '🔑 Reset Password',
        '🌐 VPN Troubleshooting',
        '💻 Display / Monitor Fix',
        '⏱️ Support SLAs & Hours',
      ],
    };
    setMessages([initialGreeting]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(query);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.reply || 'I am ready to help! Please ask any technical question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: res.suggestedActions,
        ticket: res.ticket,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: `I had trouble connecting to the IT knowledge base. Please check if you are logged in or verify your network connection.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: 'Chat history cleared. How else may I assist your IT needs today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: ['Check Ticket #152', 'Reset Password', 'VPN Troubleshooting'],
      },
    ]);
  };

  // Simple Markdown renderer for bot replies
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-sm text-[#111111] mt-2 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('• ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-indigo-600 font-bold">•</span>
                <span>{renderInline(line.replace('• ', ''))}</span>
              </div>
            );
          }
          if (line.match(/^\d+\.\s/)) {
            const num = line.match(/^(\d+\.)\s/)?.[1];
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="font-bold text-indigo-600">{num}</span>
                <span>{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
              </div>
            );
          }
          return <p key={idx}>{renderInline(line)}</p>;
        })}
      </div>
    );
  };

  const renderInline = (str: string) => {
    // Process markdown link [text](url)
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIdx = 0;
    let match;

    while ((match = linkRegex.exec(str)) !== null) {
      if (match.index > lastIdx) {
        parts.push(str.substring(lastIdx, match.index));
      }
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <a
          key={match.index}
          href={linkUrl}
          className="font-bold text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-0.5"
        >
          {linkText} →
        </a>
      );
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < str.length) {
      parts.push(str.substring(lastIdx));
    }

    // Bold formatting
    return parts.map((part, pIdx) => {
      if (typeof part !== 'string') return part;
      const boldParts = part.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={pIdx}>
          {boldParts.map((b, bIdx) =>
            bIdx % 2 === 1 ? (
              <strong key={bIdx} className="font-bold text-[#111111]">
                {b}
              </strong>
            ) : (
              b
            )
          )}
        </span>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button (Collapsed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-[#111111] hover:bg-[#222222] text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer border border-white/20 backdrop-blur-md"
        >
          {/* Glowing pulse indicator */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>

          <span className="text-base">✨</span>
          <span className="text-xs font-semibold tracking-wide">AI IT HelpDesk</span>

          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-extrabold text-white ring-2 ring-white">
              1
            </span>
          )}
        </button>
      )}

      {/* Expanded Chatbot Modal Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[580px] max-h-[85vh] bg-white/95 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#111111] to-[#252525] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-sm">
                  🤖
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#111111] rounded-full"></span>
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-tight">HelpDesk 360 AI Assistant</h3>
                <p className="text-[10px] text-white/70 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Active • 24/7 ITSM Virtual Agent
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Clear Chat History"
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer text-xs"
              >
                🔄
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize Chat"
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-[#F8F9FA] to-[#FFFFFF]">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-[#111111] text-white rounded-br-xs'
                      : 'bg-white text-[#222222] border border-[#E5E5E5] rounded-bl-xs'
                  }`}
                >
                  {m.sender === 'user' ? (
                    <p className="text-xs font-medium leading-relaxed">{m.text}</p>
                  ) : (
                    renderFormattedText(m.text)
                  )}

                  {/* Optional Embedded Ticket Card */}
                  {m.ticket && (
                    <div className="mt-3 p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#111111]">Incident #{m.ticket.id}</span>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded">
                          {m.ticket.status}
                        </span>
                      </div>
                      <p className="text-[#666666] line-clamp-1">{m.ticket.title}</p>
                      <a
                        href={`/tickets/${m.ticket.id}`}
                        className="inline-block mt-1 font-bold text-indigo-600 hover:underline"
                      >
                        Open Ticket Details →
                      </a>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-[#888888] mt-1 px-1">{m.timestamp}</span>

                {/* Suggested Prompt Action Chips */}
                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                    {m.suggestedActions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSend(action)}
                        className="text-[11px] font-semibold bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 border border-indigo-200 px-2.5 py-1 rounded-full shadow-xs transition-all cursor-pointer hover:border-indigo-400"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="bg-white border border-[#E5E5E5] rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></div>
                    <span className="text-[11px] text-[#888888] ml-2 font-medium">Assistant thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-[#EAEAEA]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask IT support or check ticket #..."
                className="flex-1 px-4 py-2.5 bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl text-xs text-[#111111] placeholder-[#888888] focus:outline-hidden focus:border-[#111111] focus:bg-white transition-all shadow-inner"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-2.5 bg-[#111111] hover:bg-[#333333] disabled:bg-[#CCCCCC] text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#999999] mt-2 px-1">
              <span>Powered by HelpDesk 360 Knowledge AI</span>
              <span>Instant Answers</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

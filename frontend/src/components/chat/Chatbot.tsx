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

// Professional OpenAI / ChatGPT Logo SVG
function ChatGptIcon({ className = "w-5 h-5 text-white" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5973 8.3829l2.02-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4018-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.1802 1.6323zM8.3107 12.8698v-2.3371l5.838-3.3685 2.0154 1.1638v6.7369a.7854.7854 0 0 0 .3927.6813l-5.838 3.3685-2.4081-1.3897v-4.8552z"/>
    </svg>
  );
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

  // Markdown renderer for bot replies
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
                <span className="text-[#10A37F] font-bold">•</span>
                <span>{renderInline(line.replace('• ', ''))}</span>
              </div>
            );
          }
          if (line.match(/^\d+\.\s/)) {
            const num = line.match(/^(\d+\.)\s/)?.[1];
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="font-bold text-[#10A37F]">{num}</span>
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
          className="font-bold text-[#10A37F] hover:text-[#0d8265] underline inline-flex items-center gap-0.5"
        >
          {linkText} →
        </a>
      );
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < str.length) {
      parts.push(str.substring(lastIdx));
    }

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
          className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-[#111111] hover:bg-[#1f1f1f] text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer border border-white/15 backdrop-blur-md"
        >
          {/* Glowing pulse indicator */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10A37F] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10A37F]"></span>
          </span>

          {/* Sleek ChatGPT Icon */}
          <div className="w-5 h-5 rounded-full bg-[#10A37F] flex items-center justify-center shadow-xs">
            <ChatGptIcon className="w-3.5 h-3.5 text-white" />
          </div>

          <span className="text-xs font-semibold tracking-wide">AI IT Assistant</span>

          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#10A37F] text-[10px] font-extrabold text-white ring-2 ring-[#111111]">
              1
            </span>
          )}
        </button>
      )}

      {/* Expanded Chatbot Modal Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[580px] max-h-[85vh] bg-white/95 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-5 py-3.5 bg-[#0f0f0f] text-white flex items-center justify-between border-b border-white/10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Professional ChatGPT Emerald Icon */}
                <div className="w-9 h-9 rounded-xl bg-[#10A37F] flex items-center justify-center text-white shadow-md ring-1 ring-white/20">
                  <ChatGptIcon className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#0f0f0f] rounded-full"></span>
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-tight flex items-center gap-1.5">
                  HelpDesk 360 AI
                  <span className="px-1.5 py-0.2 bg-[#10A37F]/20 text-[#10A37F] text-[9px] font-mono rounded font-bold uppercase">ITSM</span>
                </h3>
                <p className="text-[10px] text-white/60 flex items-center gap-1 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Online • Enterprise Virtual Agent
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
                <div className={`flex items-start gap-2 max-w-[90%] ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Bot Avatar Icon next to messages */}
                  {m.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-lg bg-[#10A37F] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <ChatGptIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl p-3.5 shadow-xs ${
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
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                            {m.ticket.status}
                          </span>
                        </div>
                        <p className="text-[#666666] line-clamp-1">{m.ticket.title}</p>
                        <a
                          href={`/tickets/${m.ticket.id}`}
                          className="inline-block mt-1 font-bold text-[#10A37F] hover:underline"
                        >
                          Open Ticket Details →
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-[#888888] mt-1 px-1">{m.timestamp}</span>

                {/* Suggested Prompt Action Chips */}
                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%] pl-8">
                    {m.suggestedActions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSend(action)}
                        className="text-[11px] font-semibold bg-white hover:bg-emerald-50 text-[#10A37F] hover:text-[#0b6e56] border border-emerald-200 px-2.5 py-1 rounded-full shadow-xs transition-all cursor-pointer hover:border-[#10A37F]"
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
                <div className="w-6 h-6 rounded-lg bg-[#10A37F] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                  <ChatGptIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-[#E5E5E5] rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10A37F] animate-bounce"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10A37F] animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10A37F] animate-bounce [animation-delay:0.4s]"></div>
                    <span className="text-[11px] text-[#888888] ml-2 font-medium">ChatGPT Assistant thinking...</span>
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
                className="flex-1 px-4 py-2.5 bg-[#F5F5F5] border border-[#E0E0E0] rounded-xl text-xs text-[#111111] placeholder-[#888888] focus:outline-hidden focus:border-[#10A37F] focus:bg-white transition-all shadow-inner"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-2.5 bg-[#10A37F] hover:bg-[#0e8f6e] disabled:bg-[#CCCCCC] text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#999999] mt-2 px-1">
              <span className="flex items-center gap-1">
                <ChatGptIcon className="w-2.5 h-2.5 text-[#10A37F]" />
                Powered by HelpDesk 360 AI
              </span>
              <span>Instant Answers</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

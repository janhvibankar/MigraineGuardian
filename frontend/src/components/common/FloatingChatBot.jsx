import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { chatService } from '../../services/chatService';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Maximize2,
  Minimize2,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export function FloatingChatBot() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am MigraineGuardian, your calm companion. How can I support your migraine wellness today?',
      time: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Suggested prompt chips for fast interaction
  const quickPrompts = [
    'Why is my risk elevated today?',
    'What patterns are in my recent logs?',
    'Soothing sleep routine tips',
  ];

  // Auto-scroll to bottom inside floating chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isTyping]);

  // Don't render floating launcher if user is already on the full Chat Page
  if (location.pathname === ROUTES.CHAT) {
    return null;
  }

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const reply = await chatService.sendMessage(query.trim());
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleOpenFullChat = () => {
    setIsOpen(false);
    navigate(ROUTES.CHAT);
  };

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end pointer-events-none select-none">
      {/* =========================================================================
          FLOATING CHAT WINDOW (POPOVER)
         ========================================================================= */}
      {isOpen && (
        <div
          className={cn(
            'pointer-events-auto mb-3 w-[calc(100vw-2rem)] sm:w-96 max-h-[540px] h-[500px]',
            'bg-white border-2 border-brand-sage/60 rounded-[22px] shadow-[0_16px_48px_-8px_rgba(38,53,47,0.22)]',
            'flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200'
          )}
          role="dialog"
          aria-label="MigraineGuardian AI Assistant"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-brand-dark to-[#1C2822] text-white flex items-center justify-between gap-2 border-b border-brand-dark/40 shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-brand-teal/25 border border-brand-teal/50 flex items-center justify-center text-white flex-shrink-0 shadow-soft">
                <Bot className="w-4 h-4 text-brand-teal" />
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-body-md font-bold text-white truncate">
                    Ask MigraineGuardian
                  </span>
                  <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse flex-shrink-0" />
                </div>
                <span className="text-[11px] text-white/70 truncate">
                  Calm AI Wellness Assistant
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={handleOpenFullChat}
                title="Expand to full screen chat"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="px-3.5 py-1.5 bg-brand-sage/15 border-b border-brand-sage/30 text-[11px] text-[#484E48] flex items-center gap-1.5 flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-teal flex-shrink-0" />
            <span className="truncate">Evidence-based educational guidance • Confidential</span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-[#FAF9F5]/70 text-left">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={cn(
                    'flex flex-col max-w-[85%] text-meta-md animate-in fade-in duration-150',
                    isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                  )}
                >
                  <div
                    className={cn(
                      'p-3 rounded-[16px] text-left leading-relaxed shadow-sm',
                      isUser
                        ? 'bg-brand-dark text-white rounded-br-none'
                        : 'bg-white text-brand-dark border border-brand-sage/40 rounded-bl-none'
                    )}
                  >
                    <p className="text-meta-md whitespace-pre-wrap">{m.text}</p>

                    {/* Rich Data Points preview if assistant */}
                    {!isUser && m.dataPoints && m.dataPoints.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-brand-sage/25 grid grid-cols-2 gap-1.5">
                        {m.dataPoints.slice(0, 2).map((dp, i) => (
                          <div key={i} className="p-1.5 rounded-lg bg-card-warm/80 text-[11px]">
                            <span className="text-muted-text block">{dp.label}</span>
                            <span className="font-bold text-brand-dark">{dp.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-text mt-1 px-1">{m.time}</span>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-meta-sm text-muted-text mr-auto p-2.5 bg-white border border-brand-sage/40 rounded-[14px]">
                <Bot className="w-3.5 h-3.5 text-brand-teal animate-spin" />
                <span className="italic">MigraineGuardian is reflecting...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Chips */}
          <div className="px-3 py-2 bg-white border-t border-brand-sage/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-card-warm border border-brand-sage/45 text-brand-dark hover:bg-brand-sage/20 whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box & Submit */}
          <form
            onSubmit={handleFormSubmit}
            className="p-2.5 sm:p-3 bg-white border-t border-brand-sage/30 flex items-center gap-2 flex-shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 min-h-[38px] px-3 py-1.5 rounded-full bg-[#FAF9F5] border border-brand-sage/50 text-meta-md text-brand-dark placeholder:text-muted-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-teal"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all cursor-pointer shadow-soft',
                inputValue.trim() && !isTyping
                  ? 'bg-brand-dark text-white hover:bg-[#1C2822]'
                  : 'bg-card-warm text-muted-text-light cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
          BOT FLOATING LAUNCHER BUTTON (Bottom Right Corner)
         ========================================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'pointer-events-auto group relative flex items-center gap-2.5 py-2.5 px-4 sm:px-5',
          'rounded-full bg-brand-dark text-white shadow-[0_8px_30px_rgb(0,0,0,0.18)]',
          'border border-brand-teal/40 hover:border-brand-teal hover:bg-[#1C2822] active:scale-95',
          'transition-all duration-200 cursor-pointer'
        )}
        aria-label={isOpen ? 'Close chat assistant' : 'Open Ask MigraineGuardian assistant'}
      >
        {/* Animated Bot Avatar Circle */}
        <div className="relative w-7 h-7 rounded-full bg-brand-teal/25 border border-brand-teal/60 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-brand-teal group-hover:scale-110 transition-transform" />
          <span className="w-2 h-2 rounded-full bg-brand-sage absolute -top-0.5 -right-0.5 animate-pulse" />
        </div>

        {/* Text Label matching user design */}
        <span className="text-body-md font-bold text-white tracking-tight flex items-center gap-1.5">
          <span>{isOpen ? 'Close Assistant' : 'Ask MigraineGuardian'}</span>
        </span>

        {/* Subtle sparkle icon */}
        <Sparkles className="w-3.5 h-3.5 text-brand-teal group-hover:rotate-12 transition-transform hidden sm:inline" />
      </button>
    </div>
  );
}

export default FloatingChatBot;

import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { useTranslation } from '../../hooks/useTranslation';
import { useChat } from '../../context/ChatContext';
import {
  Bot,
  Send,
  X,
  Maximize2,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { MarkdownMessage } from '../ui/MarkdownMessage';

export function FloatingChatBot() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    messages,
    isTyping,
    sendMessage,
    retryLast,
    startNewChat,
    clearConversation,
    isWidgetOpen: isOpen,
    setIsWidgetOpen: setIsOpen,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Suggested prompt chips for fast interaction
  const quickPrompts = [
    t('chat.quickQuestions.0') || 'Why is my risk elevated today?',
    t('chat.quickQuestions.1') || 'What patterns are in my recent logs?',
    t('chat.quickQuestions.2') || 'Soothing sleep routine tips',
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

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isTyping) return;
    sendMessage(query.trim());
    setInputValue('');
  };

  const handleRetry = (textToRetry) => {
    if (textToRetry) {
      handleSendMessage(textToRetry);
    } else {
      retryLast();
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
          aria-label={t('chat.title')}
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
                    {t('chat.askMigraineGuardian')}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse flex-shrink-0" />
                </div>
                <span className="text-[11px] text-white/70 truncate">
                  {t('chat.calmAiAssistant')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={startNewChat}
                title="New Chat"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={clearConversation}
                title={t('chat.clearChat')}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleOpenFullChat}
                title={t('chat.expandChat')}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title={t('chat.closeAssistant')}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="px-3.5 py-1.5 bg-brand-sage/15 border-b border-brand-sage/30 text-[11px] text-muted-text-dark flex items-center gap-1.5 flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-teal flex-shrink-0" />
            <span className="truncate">{t('chat.evidenceGuidance')}</span>
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
                      'p-3 rounded-[16px] text-left leading-relaxed shadow-sm border',
                      isUser
                        ? 'bg-brand-dark text-white rounded-br-none border-transparent'
                        : m.isError
                        ? 'bg-amber-50 text-amber-900 border-amber-300 rounded-bl-none'
                        : 'bg-white text-brand-dark border-brand-sage/40 rounded-bl-none'
                    )}
                  >
                    {isUser ? (
                      <p className="text-meta-md whitespace-pre-wrap">{m.text}</p>
                    ) : m.isError ? (
                      <p className="text-meta-md whitespace-pre-wrap">{m.text}</p>
                    ) : (
                      <MarkdownMessage content={m.text} />
                    )}

                    {/* Retry option on error */}
                    {m.isError && (
                      <div className="mt-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleRetry()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{t('chat.retryBtn')}</span>
                        </button>
                      </div>
                    )}

                    {/* Sources preview */}
                    {!isUser && m.sources && m.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-brand-sage/25 text-[10px] text-muted-text flex items-start gap-1 flex-wrap">
                        <BookOpen className="w-3 h-3 text-brand-teal flex-shrink-0 mt-0.5" />
                        <span className="font-semibold text-brand-dark">{t('chat.sourcesLabel')}</span>
                        <span>{m.sources.join(' \u00B7 ')}</span>
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
                <span className="italic">{t('chat.reflecting')}</span>
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
              placeholder={t('chat.placeholder')}
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
        aria-label={isOpen ? t('chat.closeAssistant') : t('chat.askMigraineGuardian')}
      >
        {/* Animated Bot Avatar Circle */}
        <div className="relative w-7 h-7 rounded-full bg-brand-teal/25 border border-brand-teal/60 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-brand-teal group-hover:scale-110 transition-transform" />
          <span className="w-2 h-2 rounded-full bg-brand-sage absolute -top-0.5 -right-0.5 animate-pulse" />
        </div>

        {/* Text Label */}
        <span className="text-body-md font-bold text-white tracking-tight flex items-center gap-1.5">
          <span>{isOpen ? t('chat.closeAssistant') : t('chat.askMigraineGuardian')}</span>
        </span>
      </button>
    </div>
  );
}

export default FloatingChatBot;

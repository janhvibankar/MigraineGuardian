import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { MarkdownMessage } from '../components/ui/MarkdownMessage';
import { Badge } from '../components/ui/Badge';
import { useTranslation } from '../hooks/useTranslation';
import { useChat } from '../context/ChatContext';
import {
  Send,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  Info,
  ChevronRight,
  Bot,
  RotateCcw,
  AlertCircle,
  Plus,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function ChatPage() {
  const messagesEndRef = useRef(null);
  const { t } = useTranslation();

  const {
    messages,
    sessionId,
    activeSessionTitle,
    sessionsList,
    isTyping,
    sendMessage,
    retryLast,
    startNewChat,
    switchSession,
    deleteSession,
    clearConversation,
  } = useChat();

  const [inputValue, setInputValue] = useState('');

  // Suggested Questions localized
  const suggestedQuestions = [
    t('chat.quickQuestions.0') || 'Why is my risk elevated today?',
    t('chat.quickQuestions.1') || 'What patterns are in my recent logs?',
    t('chat.quickQuestions.2') || 'Soothing sleep routine tips',
    t('chat.quickQuestions.3') || 'How does atmospheric pressure affect migraines?',
  ];

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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

  const formatSessionDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* =========================================================================
          HEADER & TRUST INDICATOR
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-muted-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-dark text-[#F7F6F2] flex items-center justify-center shadow-soft">
              <Bot className="w-4 h-4 text-brand-teal" />
            </div>
            <div>
              <h1 className="text-section-lg sm:text-app-lg font-semibold text-brand-dark leading-tight">
                {t('chat.title')}
              </h1>
              <p className="text-meta-md text-muted-text">
                {t('chat.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Actions: Trust Indicator, New Chat, & Clear Chat */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={startNewChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-dark hover:bg-[#1C2822] text-white text-meta-sm font-semibold transition-colors shadow-soft cursor-pointer"
            title="Start a new separate conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('chat.newChatBtn', 'New Chat')}</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card-warm border border-card-warm-border text-meta-sm text-brand-dark font-medium shadow-soft">
            <ShieldCheck className="w-4 h-4 text-brand-teal flex-shrink-0" />
            <span>{t('chat.trustIndicator')}</span>
          </div>

          <button
            type="button"
            onClick={clearConversation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-card-warm border border-muted-border text-meta-sm font-medium text-brand-dark transition-colors shadow-soft cursor-pointer"
            title={t('chat.clearChat')}
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-text" />
            <span>{t('chat.clearChat')}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN CHAT WORKSPACE (DESKTOP 2-COLUMN / MOBILE FULL-SCREEN)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* DESKTOP SIDEBAR: PERSISTENT CONVERSATION HISTORY */}
        <aside className="hidden lg:flex lg:col-span-4 flex-col justify-between p-4 rounded-card bg-card-warm/70 border border-card-warm-border space-y-4 shadow-soft">
          <div className="space-y-3">
            {/* New Chat Primary Action Button */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={startNewChat}
              className="w-full justify-center shadow-soft cursor-pointer"
            >
              {t('chat.newChatBtn', 'New Chat')}
            </Button>

            <div className="flex items-center justify-between px-2 pt-1 text-meta-sm font-semibold uppercase tracking-wider text-muted-text">
              <span>{t('chat.historyTitle', 'Chat History')}</span>
              <Badge variant="neutral" size="sm">
                {sessionsList.length}
              </Badge>
            </div>

            {/* Conversation History List */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {sessionsList.length === 0 ? (
                <div className="p-4 rounded-card-sm bg-white/50 border border-dashed border-muted-border/80 text-center text-meta-sm text-muted-text">
                  <MessageSquare className="w-5 h-5 mx-auto text-brand-teal mb-1 opacity-70" />
                  <span>{t('chat.noHistory', 'No prior conversations yet.')}</span>
                </div>
              ) : (
                sessionsList.map((item) => {
                  const isActive = item.sessionId === sessionId;
                  return (
                    <div
                      key={item.sessionId}
                      onClick={() => switchSession(item.sessionId)}
                      className={cn(
                        'w-full text-left p-3 rounded-card-sm border transition-all flex items-center justify-between gap-2 cursor-pointer group',
                        isActive
                          ? 'bg-white border-brand-sage font-semibold text-brand-dark shadow-soft'
                          : 'bg-white/40 border-muted-border/60 hover:bg-white text-muted-text hover:text-brand-dark'
                      )}
                    >
                      <div className="flex flex-col space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-brand-teal" : "text-muted-text")} />
                          <span className="text-meta-md font-medium text-brand-dark truncate">
                            {item.title || 'Conversation'}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-text">
                          {formatSessionDate(item.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Delete Session Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(item.sessionId);
                          }}
                          title="Delete this conversation"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-alert-muted hover:bg-alert-muted/10 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-text" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Context Summary */}
          <div className="p-3.5 rounded-card-sm bg-white border border-muted-border space-y-2 text-meta-sm">
            <div className="flex items-center gap-2 font-semibold text-brand-dark">
              <Info className="w-4 h-4 text-brand-teal" />
              <span>{t('chat.evidenceGuidance')}</span>
            </div>
            <p className="text-muted-text text-[11px] leading-relaxed">
              {t('chat.contextSummaryDesc')}
            </p>
          </div>
        </aside>

        {/* MAIN CONVERSATION VIEWPORT */}
        <main className="lg:col-span-8 flex flex-col justify-between bg-white border border-muted-border rounded-card p-4 sm:p-6 shadow-soft-lg min-h-[580px]">
          {/* Top Active Conversation Header & Suggestions Carousel */}
          <div className="space-y-2 pb-4 border-b border-muted-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-meta-md font-bold text-brand-dark truncate max-w-md">
                  {activeSessionTitle || 'Conversation'}
                </span>
                <span className="text-[11px] font-mono text-muted-text">
                  ({sessionId.slice(0, 14)}...)
                </span>
              </div>
              <button
                type="button"
                onClick={startNewChat}
                className="text-[11px] font-semibold text-brand-teal hover:underline flex items-center gap-1 cursor-pointer lg:hidden"
              >
                <Plus className="w-3 h-3" />
                <span>{t('chat.newChatBtn', 'New Chat')}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="text-meta-sm font-medium px-3 py-1.5 rounded-full bg-card-warm hover:bg-card-warm-hover border border-muted-border/80 text-brand-dark whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-5 max-h-[480px] pr-1 text-left">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex flex-col space-y-1.5 transition-all',
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                )}
              >
                {/* Message Bubble / Card */}
                {msg.sender === 'user' ? (
                  <div className="bg-brand-dark text-[#F7F6F2] px-4 py-3 rounded-2xl rounded-br-none max-w-[85%] sm:max-w-[75%] shadow-soft text-body-md leading-relaxed text-left">
                    {msg.text}
                  </div>
                ) : (
                  /* Assistant Calm Card Message */
                  <div
                    className={cn(
                      'rounded-2xl rounded-bl-none p-5 sm:p-6 max-w-[95%] sm:max-w-[88%] space-y-4 shadow-soft text-left border',
                      msg.isError
                        ? 'bg-amber-50/50 border-amber-300'
                        : 'bg-card-warm/50 border-card-warm-border'
                    )}
                  >
                    {/* Companion Avatar & Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-muted-border/50">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center shadow-soft',
                            msg.isError
                              ? 'bg-amber-200 text-amber-800'
                              : 'bg-brand-teal/20 text-brand-teal-dark'
                          )}
                        >
                          {msg.isError ? (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                          ) : (
                            <Bot className="w-3.5 h-3.5 text-brand-teal" />
                          )}
                        </div>
                        <span className="text-meta-sm font-semibold text-brand-dark">
                          {t('chat.title')}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-text">{msg.time}</span>
                    </div>

                    {/* Main Narrative - rendered as Markdown for assistant, plain for errors */}
                    {msg.isError ? (
                      <p className="text-body-md text-brand-dark leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <MarkdownMessage content={msg.text} className="text-body-md" />
                    )}

                    {/* Retry button on error */}
                    {msg.isError && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRetry()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-meta-sm font-medium transition-colors shadow-soft cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t('chat.retryBtn')}</span>
                        </button>
                      </div>
                    )}

                    {/* Sources Area */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-muted-border/50 text-[11px] text-muted-text flex items-start gap-1.5 flex-wrap">
                        <BookOpen className="w-3.5 h-3.5 text-brand-teal flex-shrink-0 mt-0.5" />
                        <span className="font-medium text-brand-dark">{t('chat.sourcesLabel')}</span>
                        <span>{msg.sources.join(' · ')}</span>
                      </div>
                    )}

                    {/* Safety Note / Disclaimer */}
                    <div className="p-2.5 rounded-card-sm bg-alert-muted/10 border border-alert-muted/25 text-[11px] text-[#8F443B] flex items-start gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{t('chat.disclaimer')}</span>
                    </div>
                  </div>
                )}

                {msg.sender === 'user' && (
                  <span className="text-[11px] text-muted-text px-1">{msg.time}</span>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 p-3 bg-card-warm/50 rounded-xl border border-muted-border/60 max-w-[180px] animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse delay-75" />
                <span className="w-2 h-2 rounded-full bg-brand-dark animate-pulse delay-150" />
                <span className="text-meta-sm text-muted-text ml-1">{t('chat.reflecting')}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* BOTTOM INPUT BAR */}
          <form
            onSubmit={handleFormSubmit}
            className="pt-4 border-t border-muted-border/60 flex items-center gap-2.5 select-none"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('chat.placeholder')}
              className="flex-1 min-h-[48px] px-4 py-3 rounded-input bg-card-warm/60 border border-muted-border text-body-md text-brand-dark placeholder:text-muted-text-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={Send}
              className="flex-shrink-0 shadow-soft cursor-pointer"
              disabled={!inputValue.trim() || isTyping}
            >
              {t('chat.sendBtn')}
            </Button>
          </form>
        </main>
      </div>
    </div>
  );
}

export default ChatPage;

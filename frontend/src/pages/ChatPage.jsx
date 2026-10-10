import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { MarkdownMessage } from '../components/ui/MarkdownMessage';
import { Badge } from '../components/ui/Badge';
import { chatService } from '../services/chatService';
import { useTranslation } from '../hooks/useTranslation';
import { detectMessageLanguage } from '../utils/detectMessageLanguage';
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
} from 'lucide-react';
import { cn } from '../utils/cn';

export function ChatPage() {
  const messagesEndRef = useRef(null);
  const { t, language } = useTranslation();

  const conversationHistory = chatService.getConversationHistory();

  // Create initial localized welcome message
  const createWelcomeMessage = (lang) => ({
    id: 'welcome',
    sender: 'assistant',
    text: t('chat.welcomeMessage'),
    sources: [],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  // Message Thread State
  const [messages, setMessages] = useState([createWelcomeMessage(language)]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastUserQuery, setLastUserQuery] = useState('');

  // Update welcome message on language change if user hasn't started chatting
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [createWelcomeMessage(language)];
      }
      return prev;
    });
  }, [language, t]);

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

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isTyping) return;

    setLastUserQuery(query.trim());

    // Detect the language of the current message so the RAG API responds
    // in the language the user is actually writing in, not the UI language.
    const chatLanguage = detectMessageLanguage(query.trim(), language);
    console.debug(
      '[ChatPage] UI language:', language,
      '| message language:', chatLanguage
    );

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const assistantReply = await chatService.sendMessage(query.trim(), { language: chatLanguage });
      setMessages((prev) => [...prev, assistantReply]);
    } catch (err) {
      console.error('[ChatPage] Exception sending message:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = (textToRetry) => {
    const text = textToRetry || lastUserQuery;
    if (text) {
      handleSendMessage(text);
    }
  };

  const handleClearConversation = () => {
    chatService.resetSession();
    setMessages([createWelcomeMessage(language)]);
    setLastUserQuery('');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
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

        {/* Right Header Actions: Trust Indicator & Clear Chat */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card-warm border border-card-warm-border text-meta-sm text-brand-dark font-medium shadow-soft">
            <ShieldCheck className="w-4 h-4 text-brand-teal flex-shrink-0" />
            <span>{t('chat.trustIndicator')}</span>
          </div>

          <button
            type="button"
            onClick={handleClearConversation}
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
        {/* DESKTOP SIDEBAR: CONVERSATION TOPICS (hidden on mobile) */}
        <aside className="hidden lg:flex lg:col-span-4 flex-col justify-between p-4 rounded-card bg-card-warm/70 border border-card-warm-border space-y-4 shadow-soft">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 text-meta-sm font-semibold uppercase tracking-wider text-muted-text">
              <span>{t('chat.quickQuestionsTitle')}</span>
              <Badge variant="neutral" size="sm">
                {conversationHistory.length} Topics
              </Badge>
            </div>

            <div className="space-y-1.5">
              {conversationHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSendMessage(item.title)}
                  className={cn(
                    'w-full text-left p-3 rounded-card-sm border transition-all flex flex-col space-y-1 cursor-pointer',
                    item.active
                      ? 'bg-white border-brand-sage/60 font-semibold text-brand-dark shadow-soft'
                      : 'bg-white/40 border-muted-border/60 hover:bg-white text-muted-text hover:text-brand-dark'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-meta-md font-medium text-brand-dark truncate">
                      {item.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-text" />
                  </div>
                  <span className="text-[11px] text-muted-text">{item.date}</span>
                </button>
              ))}
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
          {/* Top Quick Suggestions Carousel */}
          <div className="space-y-2 pb-4 border-b border-muted-border/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-text-light block">
              {t('chat.quickQuestionsTitle')}:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
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
                        <span>{msg.sources.join(' \u00B7 ')}</span>
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

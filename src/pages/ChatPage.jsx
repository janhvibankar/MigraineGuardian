import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ROUTES } from '../utils/constants';
import { chatService } from '../services/chatService';
import {
  Send,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  Info,
  ChevronRight,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { cn } from '../utils/cn';

export function ChatPage() {
  const messagesEndRef = useRef(null);

  // Service initial context
  const chatContext = chatService.getInitialChatContext();
  const conversationHistory = chatService.getConversationHistory();
  const suggestedQuestions = chatService.getSuggestedQuestions();

  // Message Thread State
  const [messages, setMessages] = useState(chatContext.initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    const assistantReply = await chatService.sendMessage(query);
    setMessages((prev) => [...prev, assistantReply]);
    setIsTyping(false);
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
                {chatContext.header.title}
              </h1>
              <p className="text-meta-md text-muted-text">
                {chatContext.header.subtext}
              </p>
            </div>
          </div>
        </div>

        {/* Small Trust Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card-warm border border-card-warm-border text-meta-sm text-brand-dark font-medium shadow-soft">
          <ShieldCheck className="w-4 h-4 text-brand-teal flex-shrink-0" />
          <span>{chatContext.header.trustIndicator}</span>
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
              <span>Conversations</span>
              <Badge variant="neutral" size="sm">
                {conversationHistory.length} Topics
              </Badge>
            </div>

            <div className="space-y-1.5">
              {conversationHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    'w-full text-left p-3 rounded-card-sm border transition-all flex flex-col space-y-1',
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
              <span>Current Session Context</span>
            </div>
            <p className="text-muted-text text-[11px] leading-relaxed">
              Companion has access to your 7-day sleep average (6.4h), daily stress log (6.2/10), and 2 logged episodes.
            </p>
          </div>
        </aside>

        {/* MAIN CONVERSATION VIEWPORT */}
        <main className="lg:col-span-8 flex flex-col justify-between bg-white border border-muted-border rounded-card p-4 sm:p-6 shadow-soft-lg min-h-[580px]">
          {/* Top Quick Suggestions Carousel */}
          <div className="space-y-2 pb-4 border-b border-muted-border/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-text-light block">
              Suggested Questions:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="text-meta-sm font-medium px-3 py-1.5 rounded-full bg-card-warm hover:bg-card-warm-hover border border-muted-border/80 text-brand-dark whitespace-nowrap transition-colors flex-shrink-0"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-5 max-h-[480px] pr-1">
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
                  <div className="bg-brand-dark text-[#F7F6F2] px-4 py-3 rounded-2xl rounded-br-none max-w-[85%] sm:max-w-[75%] shadow-soft text-body-md leading-relaxed">
                    {msg.text}
                  </div>
                ) : (
                  /* Assistant Calm Card Message */
                  <div className="bg-card-warm/50 border border-card-warm-border rounded-2xl rounded-bl-none p-5 sm:p-6 max-w-[95%] sm:max-w-[88%] space-y-4 shadow-soft">
                    {/* Companion Avatar & Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-muted-border/50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-teal/20 text-brand-teal-dark flex items-center justify-center shadow-soft">
                          <Bot className="w-3.5 h-3.5 text-brand-teal" />
                        </div>
                        <span className="text-meta-sm font-semibold text-brand-dark">
                          MigraineGuardian Companion
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-text">{msg.time}</span>
                    </div>

                    {/* Main Narrative */}
                    <p className="text-body-md text-brand-dark leading-relaxed">
                      {msg.text}
                    </p>

                    {/* Optional Context Data Cards */}
                    {msg.dataPoints && (
                      <div className="space-y-2 pt-1">
                        <span className="text-meta-sm font-semibold text-brand-dark block">
                          Based on your recent logs:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {msg.dataPoints.map((dp, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-card-sm bg-white border border-muted-border text-meta-sm space-y-0.5"
                            >
                              <span className="text-muted-text text-[11px] block">{dp.label}</span>
                              <span className="font-bold text-brand-dark text-body-md block">
                                {dp.value}
                              </span>
                              <span className="text-[10px] text-muted-text block">{dp.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendation */}
                    {msg.recommendation && (
                      <div className="p-3.5 rounded-card-sm bg-brand-sage/15 border border-brand-sage/35 text-meta-md text-brand-dark leading-relaxed space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-dark block">
                          Gentle Routine Suggestion:
                        </span>
                        <p>{msg.recommendation}</p>
                      </div>
                    )}

                    {/* Sources Area */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-muted-border/50 text-[11px] text-muted-text flex items-start gap-1.5 flex-wrap">
                        <BookOpen className="w-3.5 h-3.5 text-brand-teal flex-shrink-0 mt-0.5" />
                        <span className="font-medium text-brand-dark">Sources:</span>
                        <span>{msg.sources.join(' • ')}</span>
                      </div>
                    )}

                    {/* Safety Note */}
                    {msg.safetyNote && (
                      <div className="p-2.5 rounded-card-sm bg-alert-muted/10 border border-alert-muted/25 text-[11px] text-[#8F443B] flex items-start gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>{msg.safetyNote}</span>
                      </div>
                    )}
                  </div>
                )}

                {msg.sender === 'user' && (
                  <span className="text-[11px] text-muted-text px-1">{msg.time}</span>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 p-3 bg-card-warm/50 rounded-xl border border-muted-border/60 max-w-[140px] animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse delay-75" />
                <span className="w-2 h-2 rounded-full bg-brand-dark animate-pulse delay-150" />
                <span className="text-meta-sm text-muted-text ml-1">Reflecting...</span>
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
              placeholder="Ask MigraineGuardian about sleep buffers, stress patterns, or soothing protocols..."
              className="flex-1 min-h-[48px] px-4 py-3 rounded-input bg-card-warm/60 border border-muted-border text-body-md text-brand-dark placeholder:text-muted-text-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={Send}
              className="flex-shrink-0 shadow-soft"
              disabled={!inputValue.trim() || isTyping}
            >
              Send
            </Button>
          </form>
        </main>
      </div>
    </div>
  );
}

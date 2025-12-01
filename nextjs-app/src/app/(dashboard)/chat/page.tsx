/**
 * Chat Page
 * Dark/Light UI with sticky context header & sticky bottom input
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { chatService } from '@/services/chat';
import { Send, Sparkles, Loader2, Mic, Bot, User, Plus, SlidersHorizontal, Clock4, ChevronDown, ArrowUp } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage({
        message: userMessage.content,
        conversationId: undefined,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          response.response ||
          'Sorry, I could not process your request.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen bg-white text-gray-900 dark:bg-[#212121] dark:text-gray-100">
      {messages.length === 0 ? (
        /* CENTERED EMPTY STATE - No messages yet */
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
                  {/* Greeting Title */}
                  <div className="flex flex-col items-center mb-10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500/90 flex items-center justify-center shadow-md shadow-amber-500/40">
                        <Sparkles className="w-4 h-4 text-[#212121]" />
                      </div>
                      <h1 className="text-[26px] sm:text-[30px] font-semibold font-serif tracking-tight text-gray-900 dark:text-gray-100">
                        Afternoon, Work
                      </h1>
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-gray-500 dark:text-gray-400">
                      How can I help you today?
                    </p>
                  </div>
      
                  {/* Hero Input Card */}
                  <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-2xl mb-8"
                  >
                    <div className="rounded-3xl border bg-gray-50/95 border-gray-200 px-4 sm:px-6 pt-4 pb-3 shadow-xl shadow-black/5 dark:bg-[#262626] dark:border-[#3a3a3a]">
                      {/* Textarea */}
                      <div className="w-full">
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${Math.min(
                              target.scrollHeight,
                              240
                            )}px`;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmit(e);
                            }
                          }}
                          placeholder="How can I help you today?"
                          disabled={isLoading}
                          rows={1}
                          className="w-full bg-transparent text-[15px] sm:text-[16px] leading-relaxed placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none resize-none overflow-y-auto min-h-[44px] max-h-[240px]"
                          style={{ height: '44px' }}
                        />
                      </div>
      
                      {/* Bottom row inside card */}
                      <div className="mt-4 flex items-center justify-between gap-3">
                        {/* Left icon group */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 text-xs hover:bg-gray-50 hover:border-gray-300 dark:bg-[#1f1f1f] dark:border-[#3d3d3d] dark:text-gray-200 dark:hover:bg-[#262626]"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 text-xs hover:bg-gray-50 hover:border-gray-300 dark:bg-[#1f1f1f] dark:border-[#3d3d3d] dark:text-gray-200 dark:hover:bg-[#262626]"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 text-xs hover:bg-gray-50 hover:border-gray-300 dark:bg-[#1f1f1f] dark:border-[#3d3d3d] dark:text-gray-200 dark:hover:bg-[#262626]"
                          >
                            <Clock4 className="w-4 h-4" />
                          </button>
                        </div>
      
                        {/* Right model selector + send */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-[#1f1f1f] dark:border-[#3d3d3d] dark:text-gray-200 dark:hover:bg-[#262626]"
                          >
                            <span>Sonnet 4.5</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-[#f97316] text-white flex items-center justify-center transition-all hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            ) : (
                              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
      
                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
                    {[
                      { icon: '💻', label: 'Code' },
                      { icon: '✍️', label: 'Write' },
                      { icon: '🎓', label: 'Learn' },
                      { icon: '☕', label: 'Life stuff' },
                      { icon: '🎲', label: "Claude's choice" },
                    ].map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setInput(chip.label)}
                        className="px-4 py-2 text-[13px] rounded-full border bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-[#1e1e1e] dark:border-[#3a3a3a] dark:text-gray-300 dark:hover:bg-[#252525] transition-colors"
                      >
                        <span className="mr-1.5">{chip.icon}</span>
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
      ) : (
        /* CHAT STARTED - Show sticky header/footer layout */
        <>
          {/* SCROLLABLE CHAT AREA */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="px-4 sm:px-6 lg:px-8 pb-24">
              {/* Sticky context line */}
              <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/90 dark:bg-[#212121]/90 backdrop-blur border-b border-gray-100 dark:border-neutral-700">
                <p className="text-[13px] sm:text-[14px] text-gray-700 dark:text-gray-200">
                  Analyzing how Bitcoin&apos;s volatility influences investor confidence
                </p>
              </div>

              {/* CONTENT BELOW STICKY HEADER */}
              <div className="max-w-5xl mx-auto mt-4 sm:mt-6">
                {/* MESSAGE LIST */}
                <div className="space-y-5">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-2xl px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap border ${
                          message.role === 'user'
                            ? 'bg-gray-900 text-white border-gray-800 rounded-br-sm dark:bg-[#171725] dark:border-[#2f2f46]'
                            : 'bg-gray-100 text-gray-900 border-gray-200 rounded-bl-sm dark:bg-[#1b1b1b] dark:text-gray-100 dark:border-[#2f2f46]'
                        }`}
                      >
                        <p>{message.content}</p>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="px-4 sm:px-5 py-3.5 rounded-2xl rounded-bl-sm border bg-gray-100 border-gray-200 dark:bg-[#1b1b1b] dark:border-[#2f2f46]">
                        <div className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-gray-300">
                          <Loader2
                            className="w-4 h-4 animate-spin"
                            strokeWidth={2}
                          />
                          <span>Thinking…</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          </main>

          {/* STICKY BOTTOM INPUT BAR */}
          <footer className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-neutral-700 dark:bg-[#212121]/95">
            <form
              onSubmit={handleSubmit}
              className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-3"
            >
              <div className="relative">
                <div className="w-full flex items-end gap-3 rounded-2xl border bg-gray-50 border-gray-200 px-4 sm:px-5 py-3 sm:py-3.5 shadow-sm dark:bg-[#262626] dark:border-[#3a3a3a]">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Ask a follow-up question"
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 bg-transparent text-[14px] sm:text-[15px] placeholder:text-gray-400 focus:outline-none resize-none overflow-y-auto min-h-[24px] max-h-[200px] dark:placeholder:text-gray-500"
                    style={{ height: '24px' }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-gray-900 text-white flex items-center justify-center transition-colors hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed dark:bg-amber-500 dark:hover:bg-amber-400 dark:disabled:bg-[#444444] dark:disabled:text-gray-500"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 text-center sm:text-left dark:text-gray-400">
                AI can make mistakes. Please double-check important information.
              </p>
            </form>
          </footer>
        </>
      )}
    </div>
  );
}

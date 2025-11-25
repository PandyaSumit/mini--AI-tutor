import React, { useRef, useEffect, useState } from "react";
import {
    Send,
    Mic,
    Bot,
    User,
    Sparkles,
    Volume2,
    VolumeX,
    X,
} from "lucide-react";

const ChatPanel = ({
    messages = [],
    onSendMessage,
    isRecording,
    onToggleRecording,
    isProcessing,
    processingStatus,
    currentTranscript,
    isSpeaking,
    onStopSpeaking,
    ttsEnabled,
    onToggleTTS,
    className = "",
    onClose, // For mobile drawer
}) => {
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const [inputMessage, setInputMessage] = useState("");

    // Scroll chat to bottom when new stuff arrives
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentTranscript, processingStatus]);

    // Auto-grow textarea with max height
    useEffect(() => {
        if (!textareaRef.current) return;
        const el = textareaRef.current;

        el.style.height = "auto";
        const maxHeight = 120; // px – change if you want more/less lines
        const newHeight = Math.min(el.scrollHeight, maxHeight);
        el.style.height = `${newHeight}px`;
    }, [inputMessage]);

    const handleSend = () => {
        if (!inputMessage.trim()) return;
        onSendMessage(inputMessage);
        setInputMessage("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickActions = [
        { label: "Ask about this step", icon: "❓" },
        { label: "Explain differently", icon: "🔄" },
        { label: "Show me an example", icon: "💡" },
        { label: "Test my knowledge", icon: "🎯" }
    ];

    const handleQuickAction = (action) => {
        onSendMessage(action);
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <section
            className={`flex h-full flex-col bg-slate-50 lg:border-l lg:border-slate-200 ${className}`}
        >
            {/* HEADER - Streamlined */}
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm">
                                <Bot className="h-5 w-5 text-white" strokeWidth={2.5} />
                            </div>
                            {/* Activity indicator */}
                            {isProcessing ? (
                                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-500" />
                                </span>
                            ) : (
                                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">AI Tutor</h3>
                            <p className="text-xs text-slate-500">
                                {isProcessing ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Ready to help'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* TTS toggle */}
                        <button
                            onClick={onToggleTTS}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all ${ttsEnabled
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                }`}
                            title={ttsEnabled ? "Mute voice" : "Enable voice"}
                        >
                            {ttsEnabled ? (
                                <Volume2 className="h-4 w-4" />
                            ) : (
                                <VolumeX className="h-4 w-4" />
                            )}
                        </button>

                        {/* Mobile close */}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Speaking state banner (when TTS is enabled and speaking) */}
                {ttsEnabled && isSpeaking && onStopSpeaking && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 border border-blue-100">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                            </span>
                            <span className="text-xs font-medium text-slate-700">AI is speaking...</span>
                        </div>
                        <button
                            onClick={onStopSpeaking}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                        >
                            Stop
                        </button>
                    </div>
                )}
            </header>

            {/* MESSAGES */}
            <main className="flex-1 overflow-y-auto px-3 py-4 md:px-4 md:py-5">
                {/* Enhanced Empty state */}
                {messages.length === 0 && !currentTranscript && !isProcessing && (
                    <div className="flex h-full flex-col items-center justify-center gap-6 text-center px-4">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping">
                                <div className="h-20 w-20 rounded-3xl bg-blue-200 opacity-20" />
                            </div>
                            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                                <Sparkles className="h-10 w-10 text-white" strokeWidth={2} />
                            </div>
                        </div>
                        <div className="space-y-3 max-w-sm">
                            <h2 className="text-xl font-bold text-slate-900">
                                Hi! I'm your AI Tutor 👋
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-600">
                                I'm here to help you master this lesson. Ask me anything about the concepts, request visual explanations, or test your understanding!
                            </p>
                        </div>

                        {/* Example prompts */}
                        <div className="w-full max-w-md space-y-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Try asking:</p>
                            <div className="grid grid-cols-1 gap-2">
                                {["Explain this visually", "Give me an example", "Test my knowledge"].map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onSendMessage(prompt)}
                                        className="text-left px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-sm font-medium text-slate-700 hover:text-blue-600 shadow-sm hover:shadow-md active:scale-[0.98]"
                                    >
                                        <span className="mr-2">💬</span>
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {messages.map((message, idx) => {
                        const isUser = message.role === "user";

                        return (
                            <article
                                key={message._id || idx}
                                className={`flex gap-3 md:gap-4 ${isUser ? "flex-row-reverse" : "flex-row"
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="mt-0.5 flex-shrink-0">
                                    {isUser ? (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10">
                                            <User className="h-4 w-4" />
                                        </div>
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm ring-1 ring-blue-100">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>

                                {/* Bubble */}
                                <div
                                    className={`flex max-w-[82%] flex-col ${isUser ? "items-end" : "items-start"
                                        }`}
                                >
                                    <div
                                        className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm md:text-sm ${isUser
                                            ? "rounded-tr-sm bg-slate-900 text-slate-50"
                                            : "rounded-tl-sm bg-white text-slate-800 ring-1 ring-slate-200"
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                    <span className="mt-1.5 px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                                        {formatTime(message.createdAt || new Date())}
                                    </span>
                                </div>
                            </article>
                        );
                    })}

                    {/* Live transcript / processing */}
                    {(currentTranscript || isProcessing) && (
                        <article className="flex gap-3 flex-row-reverse md:gap-4">
                            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white opacity-60 shadow-sm">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="flex max-w-[82%] flex-col items-end">
                                <div className="rounded-2xl rounded-tr-sm bg-white px-4 py-3 text-[13px] leading-relaxed text-slate-600 shadow-sm ring-1 ring-slate-200 md:text-sm">
                                    {currentTranscript ? (
                                        <p className="italic">{currentTranscript}</p>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                                                <span
                                                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                                                    style={{ animationDelay: "0.12s" }}
                                                />
                                                <span
                                                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                                                    style={{ animationDelay: "0.24s" }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-slate-500">
                                                {processingStatus || "Thinking…"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>
                    )}
                </div>

                <div ref={messagesEndRef} />
            </main>

            {/* QUICK ACTIONS + INPUT */}
            <footer className="border-t border-slate-200 bg-white px-3 pb-3 pt-3 md:px-4 md:pb-4">
                {/* Quick actions - More prominent */}
                {messages.length > 0 && (
                    <div className="mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Actions</p>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {quickActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleQuickAction(action.label)}
                                    className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md active:scale-[0.97] flex items-center gap-2"
                                >
                                    <span className="text-base">{action.icon}</span>
                                    <span>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input area */}
                <div className="!box-content mx-2 md:mx-0 flex flex-col cursor-text rounded-2xl border border-slate-200 bg-white shadow-[0_0.25rem_1.25rem_rgba(15,23,42,0.06)] hover:shadow-[0_0.25rem_1.25rem_rgba(15,23,42,0.10)] transition-all duration-200 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                    <div className="m-3.5 flex flex-col gap-3.5">
                        {/* TEXT AREA */}
                        <div className="relative">
                            <div className="min-h-[1.5rem] w-full break-words transition-opacity duration-200">
                                <textarea
                                    ref={textareaRef}
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="How can I help you today?"
                                    rows={1}
                                    className="
                    w-full
                    resize-none
                    border-none
                    bg-transparent
                    text-sm
                    text-slate-900
                    placeholder:text-slate-400
                    focus:outline-none
                    focus:ring-0
                    max-h-[120px]
                    overflow-y-auto
                  "
                                />
                            </div>
                        </div>

                        {/* BOTTOM ROW: controls + send */}
                        <div className="flex w-full items-center gap-2">
                            <div className="relative flex min-w-0 flex-1 items-center gap-2">
                                {/* recording toggle (mic) */}
                                <button
                                    type="button"
                                    onClick={onToggleRecording}
                                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-all ${isRecording
                                        ? "bg-red-500 text-white shadow-sm ring-1 ring-red-400 animate-pulse"
                                        : "border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                        }`}
                                >
                                    <Mic className="h-4 w-4" />
                                </button>

                                <div className="ml-2 hidden text-xs text-slate-400 sm:block">
                                    AI Tutor · Lesson mode
                                </div>
                            </div>

                            {/* SEND BUTTON */}
                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={!inputMessage.trim() && !isRecording}
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-all ${inputMessage.trim() || isRecording
                                    ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[0.98]"
                                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                                    }`}
                                aria-label="Send message"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <p className="mt-2 text-center text-[10px] font-medium text-slate-400">
                    AI can make mistakes. Please review explanations and generated code.
                </p>
            </footer>
        </section>
    );
};

export default ChatPanel;

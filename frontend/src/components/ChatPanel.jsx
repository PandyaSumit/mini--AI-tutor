import React, { useRef, useEffect } from 'react';
import { 
    Send, 
    Mic, 
    Bot, 
    User, 
    Sparkles, 
    MoreHorizontal, 
    Volume2, 
    VolumeX,
    Loader,
    X,
    ChevronDown
} from 'lucide-react';

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
    className = '',
    onClose // For mobile drawer
}) => {
    const messagesEndRef = useRef(null);
    const [inputMessage, setInputMessage] = React.useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentTranscript, processingStatus]);

    const handleSend = () => {
        if (!inputMessage.trim()) return;
        onSendMessage(inputMessage);
        setInputMessage('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickActions = [
        "Ask about this step",
        "Explain differently",
        "Test me"
    ];

    const handleQuickAction = (action) => {
        onSendMessage(action);
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`flex flex-col h-full bg-white ${className}`}>
            {/* Header - Solid & Crisp */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm ring-1 ring-slate-200">
                            <Bot className="w-6 h-6 text-white" strokeWidth={2} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">AI Tutor</h3>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                            Online
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-1">
                    <button
                        onClick={onToggleTTS}
                        className={`p-2 rounded-lg transition-all border ${ttsEnabled
                            ? 'text-blue-600 bg-blue-50 border-blue-100'
                            : 'text-slate-400 hover:bg-slate-50 border-transparent hover:border-slate-200'
                            }`}
                        title={ttsEnabled ? "Mute Voice" : "Enable Voice"}
                    >
                        {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg lg:hidden border border-transparent hover:border-slate-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area - Clean Background */}
            <div className="flex-1 overflow-y-auto p-4 space-y-8 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
                            <Sparkles className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-slate-900 font-bold text-lg mb-2">Start Learning</h2>
                        <p className="text-sm text-slate-500 max-w-[240px] leading-relaxed">
                            Ask questions or let me guide you through the lesson step-by-step.
                        </p>
                    </div>
                )}

                {messages.map((message, idx) => (
                    <div
                        key={message._id || idx}
                        className={`flex gap-4 animate-fade-in ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        {/* Avatar */}
                        <div className="flex-shrink-0 mt-1">
                            {message.role === 'assistant' ? (
                                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm ring-1 ring-white">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shadow-sm ring-1 ring-white">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Message Bubble - Solid & Detailed */}
                        <div className={`flex flex-col max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div
                                className={`px-5 py-3.5 rounded-xl text-[15px] leading-relaxed shadow-sm ${
                                    message.role === 'user'
                                        ? 'bg-slate-800 text-white rounded-tr-sm'
                                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                                }`}
                            >
                                <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 mt-2 px-1">
                                {formatTime(message.createdAt || new Date())}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Live Transcript / Processing State */}
                {(currentTranscript || isProcessing) && (
                    <div className="flex gap-4 flex-row-reverse animate-fade-in">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shadow-sm flex-shrink-0 mt-1 opacity-50">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col items-end max-w-[85%]">
                            <div className="px-5 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-600 rounded-tr-sm shadow-sm">
                                {currentTranscript ? (
                                    <p className="italic">{currentTranscript}</p>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                                        </div>
                                        <span className="text-sm font-medium text-slate-500">{processingStatus || 'Thinking...'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions & Input Area - Distinct Container */}
            <div className="p-4 bg-white border-t border-slate-200 z-20">
                {/* Quick Actions */}
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-2">
                    {quickActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleQuickAction(action)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                        >
                            {action}
                        </button>
                    ))}
                </div>

                {/* Input Box - Solid */}
                <div className="relative flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all duration-200">
                    <button
                        onClick={onToggleRecording}
                        className={`p-2.5 rounded-lg transition-all duration-200 ${
                            isRecording 
                                ? 'bg-red-500 text-white shadow-sm animate-pulse' 
                                : 'bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 shadow-sm'
                        }`}
                    >
                        <Mic className="w-5 h-5" />
                    </button>

                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything..."
                        className="flex-1 bg-transparent border-none focus:ring-0 p-2.5 max-h-32 resize-none text-sm text-slate-800 placeholder-slate-400 font-medium"
                        rows={1}
                        style={{ minHeight: '40px' }}
                    />

                    <button
                        onClick={handleSend}
                        disabled={!inputMessage.trim() && !isRecording}
                        className={`p-2.5 rounded-lg transition-all duration-200 ${
                            inputMessage.trim()
                                ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-95'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="text-center mt-3">
                    <p className="text-[10px] text-slate-400 font-medium">AI can make mistakes. Review generated code.</p>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;

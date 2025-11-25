import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';

const FloatingChatButton = ({ onClick, hasNewMessage = false, isProcessing = false }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 group"
            aria-label="Open AI Tutor Chat"
        >
            {/* Notification Badge */}
            {hasNewMessage && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex h-5 w-5 rounded-full bg-blue-500 border-2 border-white"></span>
                </span>
            )}

            {/* Main Button */}
            <div className="relative">
                {/* Pulse ring when processing */}
                {isProcessing && (
                    <span className="absolute inset-0 rounded-2xl bg-blue-400 animate-ping opacity-20"></span>
                )}

                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group-hover:from-blue-500 group-hover:to-blue-600">
                    {isProcessing ? (
                        <Sparkles className="w-6 h-6 text-white animate-pulse" />
                    ) : (
                        <MessageSquare className="w-6 h-6 text-white" fill="white" />
                    )}
                </div>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-slate-900 text-white text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                    {isProcessing ? 'AI is thinking...' : 'Ask AI Tutor'}
                    <div className="absolute top-full right-6 w-2 h-2 bg-slate-900 transform rotate-45 -mt-1"></div>
                </div>
            </div>
        </button>
    );
};

export default FloatingChatButton;

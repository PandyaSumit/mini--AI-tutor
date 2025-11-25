import React, { useState } from 'react';
import { Layout, MessageSquare, MonitorPlay, Menu, ChevronRight, ChevronLeft, X, Bot } from 'lucide-react';
import FloatingChatButton from './FloatingChatButton';

const LessonLayout = ({
    header,
    visualContent,
    chatContent,
    footer,
    progressBar,
    isProcessing = false,
    hasUnreadMessages = false,
    className = ''
}) => {
    const [activeMobileTab, setActiveMobileTab] = useState('visual'); // 'visual' | 'chat'
    const [isChatOpen, setIsChatOpen] = useState(true);

    const handleOpenChat = () => {
        setIsChatOpen(true);
        setActiveMobileTab('chat');
    };

    return (
        <div className={`h-screen flex flex-col bg-slate-50 overflow-hidden ${className}`}>
            {/* Sticky Header - Solid & Crisp */}
            <header className="flex-shrink-0 h-16 bg-white border-b border-slate-200 z-30 relative flex items-center px-4 justify-between shadow-sm">
                <div className="flex-1">
                    {header}
                </div>
                {/* Desktop Chat Toggle - Redesigned */}
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg border transition-all relative"
                    style={{
                        backgroundColor: isChatOpen ? '#f1f5f9' : '#3b82f6',
                        borderColor: isChatOpen ? '#e2e8f0' : '#2563eb',
                        color: isChatOpen ? '#475569' : 'white'
                    }}
                >
                    {/* Notification dot */}
                    {!isChatOpen && hasUnreadMessages && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500 border border-white"></span>
                        </span>
                    )}
                    <Bot className="w-4 h-4" />
                    <span className="font-semibold text-sm">
                        {isChatOpen ? 'Hide AI Tutor' : 'Ask AI Tutor'}
                    </span>
                    {isChatOpen && <ChevronRight className="w-4 h-4" />}
                </button>
            </header>

            {/* Progress Bar */}
            {progressBar && (
                <div className="flex-shrink-0">
                    {progressBar}
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden relative">

                {/* Visual Area (Cinematic View) - Clean Background */}
                <div className={`
                    flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden transition-all duration-300 ease-in-out relative
                    ${activeMobileTab === 'visual' ? 'translate-x-0' : '-translate-x-full absolute inset-0 lg:static lg:translate-x-0'}
                `}>
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 p-4 lg:p-6">
                        <div className="w-full max-w-[1400px] mx-auto space-y-6">
                            {visualContent}

                            {/* Footer Controls */}
                            {footer && (
                                <div className="mt-6">
                                    {footer}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Panel (Collapsible Drawer) - Solid & Anchored */}
                <div className={`
                    fixed inset-y-0 right-0 w-full sm:w-[400px] lg:w-[420px] bg-white border-l border-slate-200 shadow-xl z-40
                    transform transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
                    ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}
                    ${activeMobileTab === 'chat' ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:relative'}
                    lg:shadow-none lg:h-full
                `}>
                    {chatContent}
                </div>

                {/* Floating Chat Button - Shows when chat is closed on desktop */}
                {!isChatOpen && (
                    <div className="hidden lg:block">
                        <FloatingChatButton
                            onClick={handleOpenChat}
                            hasNewMessage={hasUnreadMessages}
                            isProcessing={isProcessing}
                        />
                    </div>
                )}

            </main>

            {/* Mobile Bottom Navigation Tabs - Enhanced */}
            <div className="lg:hidden flex-shrink-0 h-16 bg-white border-t border-slate-200 flex items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex-1 flex items-center justify-around px-2">
                    <button
                        onClick={() => setActiveMobileTab('visual')}
                        className={`relative flex flex-col items-center gap-1 px-6 py-2 rounded-lg flex-1 transition-all ${
                            activeMobileTab === 'visual' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <MonitorPlay className="w-6 h-6" />
                        <span className="text-[10px] font-semibold">Lesson</span>
                    </button>

                    <button
                        onClick={() => setActiveMobileTab('chat')}
                        className={`relative flex flex-col items-center gap-1 px-6 py-2 rounded-lg flex-1 transition-all ${
                            activeMobileTab === 'chat' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {/* Notification badge for mobile */}
                        {hasUnreadMessages && activeMobileTab !== 'chat' && (
                            <span className="absolute top-1 right-4 flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                            </span>
                        )}
                        <MessageSquare className="w-6 h-6" />
                        <span className="text-[10px] font-semibold">AI Tutor</span>
                    </button>
                </div>

                {/* Hint for split view on tablet */}
                {activeMobileTab === 'visual' && (
                    <div className="hidden sm:flex lg:hidden items-center gap-2 px-4 text-xs text-slate-500">
                        <span>Swipe or tap to switch</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonLayout;

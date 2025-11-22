import React, { useState } from 'react';
import { Layout, MessageSquare, MonitorPlay, Menu, ChevronRight, ChevronLeft, X } from 'lucide-react';

const LessonLayout = ({
    header,
    visualContent,
    chatContent,
    footer,
    className = ''
}) => {
    const [activeMobileTab, setActiveMobileTab] = useState('visual'); // 'visual' | 'chat'
    const [isChatOpen, setIsChatOpen] = useState(true);

    return (
        <div className={`h-screen flex flex-col bg-[var(--color-bg-app)] overflow-hidden ${className}`}>
            {/* Sticky Header - Solid & Crisp */}
            <header className="flex-shrink-0 h-16 bg-white border-b border-slate-200 z-30 relative flex items-center px-4 justify-between shadow-sm">
                <div className="flex-1">
                    {header}
                </div>
                {/* Desktop Chat Toggle */}
                <button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="hidden lg:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200"
                >
                    {isChatOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {isChatOpen ? 'Hide Chat' : 'Show Chat'}
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden relative">
                
                {/* Visual Area (Cinematic View) - Clean Background */}
                <div className={`
                    flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden transition-all duration-500 ease-in-out relative
                    ${activeMobileTab === 'visual' ? 'translate-x-0' : '-translate-x-full absolute inset-0 lg:static lg:translate-x-0'}
                `}>
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 p-4 lg:p-6 flex flex-col items-center">
                        <div className="w-full max-w-[1400px] h-full flex flex-col gap-6">
                            {/* Visual Content Container - Solid Card */}
                            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group">
                                {visualContent}
                            </div>
                            
                            {/* Footer Controls */}
                            {footer && (
                                <div className="flex-shrink-0">
                                    {footer}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Panel (Collapsible Drawer) - Solid & Anchored */}
                <div className={`
                    fixed inset-y-0 right-0 w-full sm:w-[400px] lg:w-[420px] bg-white border-l border-slate-200 shadow-xl z-40
                    transform transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1)
                    ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}
                    ${activeMobileTab === 'chat' ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:relative'}
                    lg:shadow-none lg:h-full
                `}>
                    {chatContent}
                </div>

            </main>

            {/* Mobile Bottom Navigation Tabs */}
            <div className="lg:hidden flex-shrink-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => setActiveMobileTab('visual')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-all ${
                        activeMobileTab === 'visual' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <MonitorPlay className="w-6 h-6" />
                    <span className="text-[10px] font-semibold">Lesson</span>
                </button>
                
                <button
                    onClick={() => setActiveMobileTab('chat')}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-all ${
                        activeMobileTab === 'chat' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-[10px] font-semibold">AI Tutor</span>
                </button>
            </div>
        </div>
    );
};

export default LessonLayout;

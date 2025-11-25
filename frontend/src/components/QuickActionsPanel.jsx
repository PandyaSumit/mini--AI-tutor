import React, { useState } from 'react';
import { Zap, Target, BookOpen, MessageSquare, Sparkles, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';

const QuickActionsPanel = ({ onAction, className = '' }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const actions = [
        {
            id: 'objectives',
            icon: Target,
            label: 'View Objectives',
            description: 'See what you\'ll learn',
            color: 'blue',
            shortcut: '1'
        },
        {
            id: 'content',
            icon: BookOpen,
            label: 'Explore Content',
            description: 'Key concepts & examples',
            color: 'indigo',
            shortcut: '2'
        },
        {
            id: 'ask-ai',
            icon: MessageSquare,
            label: 'Ask AI Tutor',
            description: 'Get instant help',
            color: 'purple',
            shortcut: '3'
        },
        {
            id: 'visual',
            icon: Sparkles,
            label: 'Request Visual',
            description: 'See diagrams & animations',
            color: 'pink',
            shortcut: '4'
        },
        {
            id: 'quiz',
            icon: GraduationCap,
            label: 'Take Quiz',
            description: 'Test your knowledge',
            color: 'green',
            shortcut: '5'
        }
    ];

    const colorMap = {
        blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
        purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
        pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
        green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
    };

    return (
        <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm ${className}`}>
            {/* Header - Collapsible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-sm">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
                        <p className="text-sm text-slate-500">Jump to any feature instantly</p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
            </button>

            {/* Actions Grid */}
            {isExpanded && (
                <div className="border-t border-slate-100 p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {actions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => onAction && onAction(action.id)}
                                    className="group relative p-4 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all hover:shadow-md active:scale-95"
                                >
                                    {/* Shortcut badge */}
                                    <div className="absolute top-2 right-2 w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center">
                                        <span className="text-xs font-bold text-slate-600">{action.shortcut}</span>
                                    </div>

                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[action.color]} flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform shadow-md`}>
                                        <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                                    </div>

                                    {/* Label */}
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-slate-900 mb-1">
                                            {action.label}
                                        </div>
                                        <div className="text-xs text-slate-600 leading-tight">
                                            {action.description}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Keyboard hint */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-center text-slate-500">
                            <span className="font-semibold">💡 Tip:</span> Press{' '}
                            <kbd className="px-2 py-1 bg-slate-100 rounded border border-slate-300 text-slate-700 font-mono text-xs">1-5</kbd>
                            {' '}to quickly access these actions
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickActionsPanel;

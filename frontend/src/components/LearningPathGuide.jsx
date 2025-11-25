import React from 'react';
import { Target, BookOpen, MessageSquare, Sparkles, GraduationCap, ChevronRight, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

const LearningPathGuide = ({ currentPhase = 'start', onNavigate, className = '' }) => {
    const phases = [
        {
            id: 'objectives',
            title: 'Review Objectives',
            description: 'Understand what you\'ll learn',
            icon: Target,
            color: 'blue',
            action: 'objectives',
            actionLabel: 'View Objectives'
        },
        {
            id: 'explore',
            title: 'Explore Content',
            description: 'Read key concepts & examples',
            icon: BookOpen,
            color: 'indigo',
            action: 'content',
            actionLabel: 'Explore Content'
        },
        {
            id: 'interact',
            title: 'Ask Questions',
            description: 'Get help from your AI Tutor',
            icon: MessageSquare,
            color: 'purple',
            action: 'chat',
            actionLabel: 'Ask AI Tutor'
        },
        {
            id: 'visualize',
            title: 'Visual Learning',
            description: 'Request diagrams & animations',
            icon: Sparkles,
            color: 'pink',
            action: 'whiteboard',
            actionLabel: 'Try Whiteboard'
        },
        {
            id: 'assess',
            title: 'Test Knowledge',
            description: 'Take the quiz & move forward',
            icon: GraduationCap,
            color: 'green',
            action: 'quiz',
            actionLabel: 'Take Quiz'
        }
    ];

    const getPhaseStatus = (phaseId) => {
        const currentIndex = phases.findIndex(p => p.id === currentPhase);
        const phaseIndex = phases.findIndex(p => p.id === phaseId);

        if (phaseIndex < currentIndex) return 'completed';
        if (phaseIndex === currentIndex) return 'current';
        return 'upcoming';
    };

    const colorMap = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' },
        indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', gradient: 'from-indigo-500 to-indigo-600' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', gradient: 'from-purple-500 to-purple-600' },
        pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', gradient: 'from-pink-500 to-pink-600' },
        green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', gradient: 'from-green-500 to-green-600' }
    };

    return (
        <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm ${className}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Your Learning Path</h3>
                        <p className="text-sm text-slate-600">Follow these steps for the best experience</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                        <span>Completed</span>
                        <Circle className="w-3 h-3 fill-blue-500 text-blue-500" />
                        <span>Current</span>
                        <Circle className="w-3 h-3 text-slate-300" />
                        <span>Next</span>
                    </div>
                </div>
            </div>

            {/* Path Steps - Horizontal on desktop, vertical on mobile */}
            <div className="p-6">
                {/* Desktop: Horizontal Flow */}
                <div className="hidden md:flex items-start gap-3">
                    {phases.map((phase, idx) => {
                        const status = getPhaseStatus(phase.id);
                        const colors = colorMap[phase.color];
                        const Icon = phase.icon;

                        return (
                            <React.Fragment key={phase.id}>
                                <div className="flex-1 min-w-0">
                                    <button
                                        onClick={() => onNavigate && onNavigate(phase.action)}
                                        className={`w-full p-4 rounded-xl border-2 transition-all text-left group hover:shadow-md ${
                                            status === 'completed'
                                                ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                                : status === 'current'
                                                ? `${colors.bg} ${colors.border} shadow-md`
                                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                        }`}
                                        disabled={status === 'upcoming'}
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                status === 'completed'
                                                    ? 'bg-green-500'
                                                    : status === 'current'
                                                    ? `bg-gradient-to-br ${colors.gradient}`
                                                    : 'bg-slate-300'
                                            }`}>
                                                {status === 'completed' ? (
                                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                                ) : (
                                                    <Icon className="w-5 h-5 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                    Step {idx + 1}
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-900 mb-1">
                                                    {phase.title}
                                                </h4>
                                                <p className="text-xs text-slate-600 leading-relaxed">
                                                    {phase.description}
                                                </p>
                                            </div>
                                        </div>

                                        {status === 'current' && (
                                            <div className={`flex items-center justify-between px-3 py-2 ${colors.bg} rounded-lg border ${colors.border}`}>
                                                <span className={`text-xs font-semibold ${colors.text}`}>
                                                    {phase.actionLabel}
                                                </span>
                                                <ArrowRight className={`w-4 h-4 ${colors.text}`} />
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {idx < phases.length - 1 && (
                                    <div className="flex items-center justify-center pt-8">
                                        <ChevronRight className={`w-5 h-5 ${
                                            getPhaseStatus(phases[idx + 1].id) === 'completed' ||
                                            getPhaseStatus(phases[idx + 1].id) === 'current'
                                                ? 'text-blue-500'
                                                : 'text-slate-300'
                                        }`} />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Mobile: Vertical Flow */}
                <div className="md:hidden space-y-3">
                    {phases.map((phase, idx) => {
                        const status = getPhaseStatus(phase.id);
                        const colors = colorMap[phase.color];
                        const Icon = phase.icon;

                        return (
                            <button
                                key={phase.id}
                                onClick={() => onNavigate && onNavigate(phase.action)}
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                    status === 'completed'
                                        ? 'bg-green-50 border-green-200'
                                        : status === 'current'
                                        ? `${colors.bg} ${colors.border} shadow-md`
                                        : 'bg-slate-50 border-slate-200'
                                }`}
                                disabled={status === 'upcoming'}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        status === 'completed'
                                            ? 'bg-green-500'
                                            : status === 'current'
                                            ? `bg-gradient-to-br ${colors.gradient}`
                                            : 'bg-slate-300'
                                    }`}>
                                        {status === 'completed' ? (
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                        ) : (
                                            <Icon className="w-5 h-5 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Step {idx + 1}
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900">{phase.title}</h4>
                                        <p className="text-xs text-slate-600">{phase.description}</p>
                                    </div>
                                    {status === 'current' && (
                                        <ArrowRight className={`w-5 h-5 ${colors.text}`} />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LearningPathGuide;

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Brain, Search, Zap, CheckCircle, Loader } from 'lucide-react';

/**
 * StreamingThinkingProcess Component
 * Displays AI's thinking process in REAL-TIME as it streams
 * Shows live status updates and progressive disclosure
 */
const StreamingThinkingProcess = ({ phases = [], isStreaming = false, onToggle }) => {
    const [isExpanded, setIsExpanded] = useState(true); // Auto-expand during streaming
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Update current time every 100ms for live timing display
    useEffect(() => {
        if (isStreaming) {
            const interval = setInterval(() => {
                setCurrentTime(Date.now());
            }, 100);
            return () => clearInterval(interval);
        }
    }, [isStreaming]);

    // Auto-expand when streaming starts
    useEffect(() => {
        if (isStreaming && !isExpanded) {
            setIsExpanded(true);
        }
    }, [isStreaming]);

    if (!phases || phases.length === 0) {
        return null;
    }

    // Phase icons mapping
    const phaseIcons = {
        understanding: Brain,
        search: Search,
        analysis: Zap,
        synthesis: CheckCircle,
        formulation: CheckCircle
    };

    // Phase colors mapping
    const phaseColors = {
        understanding: 'text-blue-600 bg-blue-50',
        search: 'text-purple-600 bg-purple-50',
        analysis: 'text-amber-600 bg-amber-50',
        synthesis: 'text-green-600 bg-green-50',
        formulation: 'text-indigo-600 bg-indigo-50'
    };

    const completedPhases = phases.filter(p => p.status === 'completed').length;
    const totalPhases = phases.length;
    const activePhase = phases.find(p => p.status === 'in_progress');

    // Calculate live elapsed time for active phase
    const getElapsedTime = (phase) => {
        if (phase.status === 'completed') {
            return phase.duration || 0;
        }
        if (phase.status === 'in_progress' && phase.timestamp) {
            return Math.floor(currentTime - phase.timestamp);
        }
        return 0;
    };

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
        if (onToggle) onToggle(!isExpanded);
    };

    return (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white overflow-hidden animate-scale-in">
            {/* Header - Always Visible */}
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Collapse thinking process' : 'Expand thinking process'}
            >
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                        isStreaming ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                        {isStreaming ? (
                            <Loader className="w-4 h-4 text-purple-600 animate-spin" strokeWidth={2} />
                        ) : (
                            <Brain className="w-4 h-4 text-purple-600" strokeWidth={2} />
                        )}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold text-gray-900">
                            {isStreaming ? 'Thinking...' : 'Thought process'}
                        </span>
                        <span className="text-xs text-gray-500">
                            {completedPhases}/{totalPhases} step{totalPhases !== 1 ? 's' : ''} completed
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isExpanded && (
                        <span className="hidden sm:inline text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                            Click to {isExpanded ? 'collapse' : 'expand'}
                        </span>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" strokeWidth={2} />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" strokeWidth={2} />
                    )}
                </div>
            </button>

            {/* Thinking Steps - Collapsible */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="px-4 pb-4 pt-2 space-y-3">
                    {phases.map((phase, index) => {
                        const Icon = phaseIcons[phase.phase] || Brain;
                        const colorClass = phaseColors[phase.phase] || 'text-gray-600 bg-gray-50';
                        const elapsedTime = getElapsedTime(phase);

                        return (
                            <div
                                key={index}
                                className={`flex gap-3 transition-all duration-300 ${
                                    phase.status !== 'pending' ? 'animate-fadeIn' : 'opacity-40'
                                }`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Step Icon */}
                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all ${
                                    phase.status === 'completed' ? colorClass :
                                    phase.status === 'in_progress' ? colorClass + ' ring-2 ring-purple-300 ring-offset-2' :
                                    'bg-gray-100 text-gray-400'
                                }`}>
                                    {phase.status === 'in_progress' ? (
                                        <Loader className="w-4 h-4 animate-spin" strokeWidth={2} />
                                    ) : phase.status === 'completed' ? (
                                        <Icon className="w-4 h-4" strokeWidth={2} />
                                    ) : (
                                        <Icon className="w-4 h-4" strokeWidth={2} />
                                    )}
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-semibold text-gray-900">
                                                {phase.title}
                                            </h4>
                                            {phase.status === 'in_progress' && (
                                                <span className="text-xs text-purple-600 font-medium animate-pulse">
                                                    in progress...
                                                </span>
                                            )}
                                            {phase.status === 'completed' && (
                                                <CheckCircle className="w-3.5 h-3.5 text-green-500" strokeWidth={2} />
                                            )}
                                        </div>
                                        {phase.status !== 'pending' && elapsedTime > 0 && (
                                            <span className={`text-xs ml-2 font-mono ${
                                                phase.status === 'in_progress' ? 'text-purple-600 font-semibold' : 'text-gray-400'
                                            }`}>
                                                {elapsedTime}ms
                                            </span>
                                        )}
                                    </div>
                                    {phase.content && (
                                        <p className="text-xs text-gray-600 leading-relaxed animate-fadeIn">
                                            {phase.content}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Completion Summary */}
                    {!isStreaming && completedPhases === totalPhases && (
                        <div className="mt-4 pt-3 border-t border-gray-200 animate-fadeIn">
                            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" strokeWidth={2} />
                                Completed {totalPhases} thinking step{totalPhases !== 1 ? 's' : ''} in{' '}
                                {(phases.reduce((sum, p) => sum + (p.duration || 0), 0) / 1000).toFixed(2)}s
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StreamingThinkingProcess;

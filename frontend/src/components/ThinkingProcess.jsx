import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Search, Zap, CheckCircle, Loader } from 'lucide-react';

/**
 * ThinkingProcess Component
 * Displays AI's thinking/reasoning process similar to Claude.ai
 * Collapsible, animated, and production-ready
 */
const ThinkingProcess = ({ thinking, isComplete = true }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!thinking || !thinking.steps || thinking.steps.length === 0) {
        return null;
    }

    const { steps, summary } = thinking;

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

    return (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
            {/* Header - Always Visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Collapse thinking process' : 'Expand thinking process'}
            >
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                        isComplete ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                        {isComplete ? (
                            <Brain className="w-4 h-4 text-purple-600" strokeWidth={2} />
                        ) : (
                            <Loader className="w-4 h-4 text-gray-600 animate-spin" strokeWidth={2} />
                        )}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold text-gray-900">
                            {isComplete ? 'Thought process' : 'Thinking...'}
                        </span>
                        <span className="text-xs text-gray-500">
                            {steps.length} step{steps.length !== 1 ? 's' : ''}
                            {summary && ` · ${(summary.totalDuration / 1000).toFixed(2)}s`}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isExpanded && (
                        <span className="hidden sm:inline text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                            Click to expand
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
                    {steps.map((step, index) => {
                        const Icon = phaseIcons[step.phase] || Brain;
                        const colorClass = phaseColors[step.phase] || 'text-gray-600 bg-gray-50';

                        return (
                            <div
                                key={index}
                                className="flex gap-3 animate-fadeIn"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Step Icon */}
                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${colorClass}`}>
                                    <Icon className="w-4 h-4" strokeWidth={2} />
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-semibold text-gray-900">
                                            {step.title}
                                        </h4>
                                        {step.duration && (
                                            <span className="text-xs text-gray-400 ml-2">
                                                {step.duration}ms
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        {step.content}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                    {/* Summary Footer */}
                    {isComplete && summary && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 text-center">
                                {summary.summary}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThinkingProcess;

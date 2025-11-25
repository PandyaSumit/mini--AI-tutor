import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Target, Sparkles, MessageSquare, BookOpen, CheckCircle2 } from 'lucide-react';

const WelcomeTour = ({ onClose, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has seen the tour
        const hasSeenTour = localStorage.getItem('hasSeenWelcomeTour');
        if (!hasSeenTour) {
            setIsVisible(true);
        }
    }, []);

    const steps = [
        {
            icon: Target,
            title: "Welcome to Your Learning Journey!",
            description: "Let's take a quick tour to help you get the most out of your AI tutoring session.",
            visual: "🎯",
            color: "blue"
        },
        {
            icon: BookOpen,
            title: "Start with Learning Objectives",
            description: "Begin by reviewing the objectives to understand what you'll learn. This gives you a clear roadmap for the session.",
            visual: "📚",
            color: "indigo",
            highlight: "objectives"
        },
        {
            icon: MessageSquare,
            title: "Ask Your AI Tutor Anything",
            description: "Click 'Ask AI Tutor' anytime to get help. Request explanations, examples, or visual demonstrations. The AI is always ready to assist!",
            visual: "💬",
            color: "blue",
            highlight: "chat"
        },
        {
            icon: Sparkles,
            title: "Watch Concepts Come to Life",
            description: "When you ask for visual explanations, the AI will draw diagrams and animations on the whiteboard. Try saying 'Show me visually' or 'Draw a diagram'.",
            visual: "✨",
            color: "purple",
            highlight: "whiteboard"
        },
        {
            icon: CheckCircle2,
            title: "Track Your Progress",
            description: "Your progress is tracked at the top. Complete objectives, take the quiz, and move to the next lesson when ready!",
            visual: "✅",
            color: "green",
            highlight: "progress"
        }
    ];

    const currentStepData = steps[currentStep];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        localStorage.setItem('hasSeenWelcomeTour', 'true');
        setIsVisible(false);
        if (onComplete) onComplete();
    };

    const handleSkip = () => {
        localStorage.setItem('hasSeenWelcomeTour', 'true');
        setIsVisible(false);
        if (onClose) onClose();
    };

    if (!isVisible) return null;

    const colorMap = {
        blue: 'from-blue-500 to-blue-600',
        indigo: 'from-indigo-500 to-indigo-600',
        purple: 'from-purple-500 to-purple-600',
        green: 'from-green-500 to-green-600'
    };

    const Icon = currentStepData.icon;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />

            {/* Modal */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-300">
                    {/* Close button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    <div className="p-8 md:p-12">
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 animate-pulse">
                                    <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${colorMap[currentStepData.color]} opacity-20`} />
                                </div>
                                <div className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${colorMap[currentStepData.color]} shadow-lg flex items-center justify-center`}>
                                    <span className="text-5xl">{currentStepData.visual}</span>
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
                            {currentStepData.title}
                        </h2>

                        {/* Description */}
                        <p className="text-lg text-slate-600 text-center leading-relaxed mb-8 max-w-lg mx-auto">
                            {currentStepData.description}
                        </p>

                        {/* Progress dots */}
                        <div className="flex items-center justify-center gap-2 mb-8">
                            {steps.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentStep(idx)}
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        idx === currentStep
                                            ? 'w-8 bg-blue-600'
                                            : idx < currentStep
                                            ? 'w-2 bg-green-500'
                                            : 'w-2 bg-slate-300'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={handleSkip}
                                className="px-6 py-3 text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                Skip Tour
                            </button>

                            <div className="flex items-center gap-3">
                                {currentStep > 0 && (
                                    <button
                                        onClick={handlePrevious}
                                        className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                )}

                                <button
                                    onClick={handleNext}
                                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                >
                                    {currentStep === steps.length - 1 ? (
                                        <>
                                            Get Started
                                            <CheckCircle2 className="w-4 h-4" />
                                        </>
                                    ) : (
                                        <>
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WelcomeTour;

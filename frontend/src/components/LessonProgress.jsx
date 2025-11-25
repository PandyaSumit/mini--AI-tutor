import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const LessonProgress = ({
    currentStep = 1,
    totalSteps = 5,
    completedSteps = 0,
    estimatedTime = '15 min',
    title = 'Lesson Progress'
}) => {
    const progressPercentage = (completedSteps / totalSteps) * 100;

    return (
        <div className="bg-white border-b border-slate-200 px-4 py-3">
            <div className="max-w-[1920px] mx-auto">
                <div className="flex items-center justify-between gap-4">
                    {/* Left: Progress Info */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                {[...Array(totalSteps)].map((_, idx) => (
                                    <div key={idx} className="relative">
                                        {idx < completedSteps ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" />
                                        ) : idx === currentStep - 1 ? (
                                            <div className="relative">
                                                <Circle className="w-5 h-5 text-blue-600 fill-blue-50" />
                                                <span className="absolute inset-0 animate-ping">
                                                    <Circle className="w-5 h-5 text-blue-400 opacity-75" />
                                                </span>
                                            </div>
                                        ) : (
                                            <Circle className="w-5 h-5 text-slate-300" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="hidden sm:block">
                            <div className="text-sm font-semibold text-slate-900">
                                Step {currentStep} of {totalSteps}
                            </div>
                            <div className="text-xs text-slate-500">
                                {completedSteps} completed · {totalSteps - completedSteps} remaining
                            </div>
                        </div>
                    </div>

                    {/* Right: Time Estimate */}
                    <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{estimatedTime}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default LessonProgress;

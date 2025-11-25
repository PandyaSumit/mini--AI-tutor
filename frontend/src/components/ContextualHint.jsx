import React, { useState } from 'react';
import { X, Lightbulb, ArrowRight, Info } from 'lucide-react';

const ContextualHint = ({
    id,
    title,
    message,
    actionLabel,
    onAction,
    type = 'tip', // 'tip', 'info', 'next-step'
    dismissible = true,
    className = ''
}) => {
    const [isDismissed, setIsDismissed] = useState(() => {
        if (!dismissible) return false;
        return localStorage.getItem(`hint-dismissed-${id}`) === 'true';
    });

    const handleDismiss = () => {
        if (dismissible) {
            localStorage.setItem(`hint-dismissed-${id}`, 'true');
            setIsDismissed(true);
        }
    };

    if (isDismissed) return null;

    const typeConfig = {
        tip: {
            icon: Lightbulb,
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            iconBg: 'bg-yellow-500',
            textColor: 'text-yellow-900',
            accentColor: 'text-yellow-600'
        },
        info: {
            icon: Info,
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            iconBg: 'bg-blue-500',
            textColor: 'text-blue-900',
            accentColor: 'text-blue-600'
        },
        'next-step': {
            icon: ArrowRight,
            bg: 'bg-green-50',
            border: 'border-green-200',
            iconBg: 'bg-green-500',
            textColor: 'text-green-900',
            accentColor: 'text-green-600'
        }
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div className={`${config.bg} ${config.border} border rounded-xl p-4 shadow-sm relative ${className}`}>
            {dismissible && (
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>

                <div className="flex-1 min-w-0 pr-6">
                    {title && (
                        <h4 className={`text-sm font-bold ${config.textColor} mb-1`}>
                            {title}
                        </h4>
                    )}
                    <p className={`text-sm ${config.accentColor} leading-relaxed`}>
                        {message}
                    </p>

                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className={`mt-3 px-4 py-2 bg-white border ${config.border} ${config.accentColor} rounded-lg text-sm font-semibold hover:bg-white hover:shadow-sm transition-all active:scale-95 inline-flex items-center gap-2`}
                        >
                            {actionLabel}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContextualHint;

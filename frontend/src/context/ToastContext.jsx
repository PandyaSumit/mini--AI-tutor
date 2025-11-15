import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((message, duration) => {
        addToast(message, 'success', duration);
    }, [addToast]);

    const error = useCallback((message, duration) => {
        addToast(message, 'error', duration);
    }, [addToast]);

    const info = useCallback((message, duration) => {
        addToast(message, 'info', duration);
    }, [addToast]);

    const warning = useCallback((message, duration) => {
        addToast(message, 'warning', duration);
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ success, error, info, warning }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-2" aria-live="polite">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const Toast = ({ toast, onClose }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-600" />,
        error: <XCircle className="w-5 h-5 text-red-600" />,
        warning: <AlertCircle className="w-5 h-5 text-orange-600" />,
        info: <Info className="w-5 h-5 text-blue-600" />
    };

    const styles = {
        success: 'bg-green-50 border-green-200 text-green-900',
        error: 'bg-red-50 border-red-200 text-red-900',
        warning: 'bg-orange-50 border-orange-200 text-orange-900',
        info: 'bg-blue-50 border-blue-200 text-blue-900'
    };

    return (
        <div
            className={`flex items-start gap-3 min-w-[320px] max-w-md p-4 rounded-xl border-2 shadow-lg animate-slide-in-right ${styles[toast.type]
                }`}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={onClose}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

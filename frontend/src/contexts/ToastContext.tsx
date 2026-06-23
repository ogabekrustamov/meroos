import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastApi {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Show transient notifications. Must be used within <ToastProvider>. */
export const useToast = (): ToastApi => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
};

const DURATION = 4000;
let nextId = 0;

const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} strokeWidth={1.85} />,
    error: <AlertCircle size={18} strokeWidth={1.85} />,
    info: <Info size={18} strokeWidth={1.85} />,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const remove = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const push = useCallback((type: ToastType, message: string) => {
        const id = nextId++;
        setToasts((prev) => [...prev, { id, type, message }]);
        window.setTimeout(() => remove(id), DURATION);
    }, [remove]);

    const api = useMemo<ToastApi>(() => ({
        success: (m) => push('success', m),
        error: (m) => push('error', m),
        info: (m) => push('info', m),
    }), [push]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            {createPortal(
                <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
                    {toasts.map((t) => (
                        <div key={t.id} className={`toast toast-${t.type} toast-enter`} role="alert">
                            <span className="toast-icon">{ICONS[t.type]}</span>
                            <span className="toast-msg">{t.message}</span>
                            <button
                                type="button"
                                className="toast-close"
                                onClick={() => remove(t.id)}
                                aria-label="Dismiss"
                            >
                                <X size={16} strokeWidth={2} />
                            </button>
                        </div>
                    ))}
                </div>,
                document.body,
            )}
        </ToastContext.Provider>
    );
};

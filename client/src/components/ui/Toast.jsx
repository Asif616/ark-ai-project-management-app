import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
    return useContext(ToastContext);
}

const meta = {
    success: ['badge-success', CheckCircle2],
    danger: ['badge-danger', AlertCircle],
    info: ['badge-info', Info],
};

export function ToastProvider({ children }) {
    const [items, setItems] = useState([]);
    const idRef = useRef(0);

    const dismiss = useCallback((id) => setItems((t) => t.filter((x) => x.id !== id)), []);

    const toast = useCallback(
        (message, tone = 'success') => {
            const id = ++idRef.current;
            setItems((t) => [...t.slice(-3), { id, message, tone }]);
            setTimeout(() => dismiss(id), 3800);
        },
        [dismiss]
    );

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {typeof document !== 'undefined' &&
                createPortal(
                    <div className="pointer-events-none fixed bottom-5 right-5 z-[1100] flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2">
                        <AnimatePresence initial={false}>
                            {items.map((t) => {
                                const [cls, Icon] = meta[t.tone] || meta.info;
                                return (
                                    <motion.div
                                        key={t.id}
                                        layout
                                        initial={{ opacity: 0, x: 40, scale: 0.96 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 40, scale: 0.96 }}
                                        transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                                        className="surface pointer-events-auto flex items-start gap-3 p-3 pr-2 shadow-pop"
                                    >
                                        <span className={`mt-0.5 ${cls} flex h-6 w-6 shrink-0 items-center justify-center rounded-full`}>
                                            <Icon className="h-3.5 w-3.5" />
                                        </span>
                                        <p className="flex-1 text-sm text-[var(--text-primary)]">{t.message}</p>
                                        <button
                                            type="button"
                                            onClick={() => dismiss(t.id)}
                                            aria-label="Dismiss"
                                            className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>,
                    document.body
                )}
        </ToastContext.Provider>
    );
}

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, dismissable = true }) {
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape' && dismissable) onClose?.();
        };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose, dismissable]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                >
                    <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => dismissable && onClose?.()} />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        className="surface relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-pop"
                        initial={{ opacity: 0, scale: 0.96, y: 14 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 8 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                                {title}
                            </h2>
                            {dismissable && (
                                <button
                                    type="button"
                                    onClick={() => onClose?.()}
                                    aria-label="Close"
                                    className="-m-1.5 rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-primary-500/10 hover:text-[var(--text-primary)]"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

import { Loader2 } from 'lucide-react';

export function Spinner({ className = '', label = 'Loading' }) {
    return (
        <div className={`flex items-center justify-center gap-2 text-[var(--text-muted)] ${className}`} role="status">
            <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            <span className="sr-only">{label}</span>
        </div>
    );
}

export function Skeleton({ className = '' }) {
    return (
        <div
            className={`relative overflow-hidden rounded-md bg-[var(--bg-secondary)] after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent ${className}`}
        />
    );
}

export function EmptyState({ icon: Icon, title, hint, action }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            {Icon && (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-400">
                    <Icon className="h-6 w-6" />
                </span>
            )}
            <p className="font-display text-sm font-semibold text-[var(--text-primary)]">{title}</p>
            {hint && <p className="max-w-sm text-sm text-[var(--text-muted)]">{hint}</p>}
            {action}
        </div>
    );
}

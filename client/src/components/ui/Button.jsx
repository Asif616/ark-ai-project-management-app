import { Loader2 } from 'lucide-react';

const base =
    'inline-flex items-center justify-center gap-2 rounded-control font-medium select-none ' +
    'transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ' +
    'disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]';

const variants = {
    primary: 'text-white shadow-md hover:shadow-glow hover:brightness-110',
    outline:
        'border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-primary-500/50 hover:text-primary-400',
    ghost: 'text-[var(--text-secondary)] hover:bg-primary-500/10 hover:text-[var(--text-primary)]',
    danger: 'text-[var(--color-danger-500)] hover:bg-[rgba(var(--color-danger-rgb),0.12)]',
};

const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
    icon: 'h-11 w-11 p-0',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    className = '',
    children,
    type = 'button',
    style,
    ...rest
}) {
    return (
        <button
            type={type}
            className={[base, variants[variant], sizes[size], className].filter(Boolean).join(' ')}
            style={variant === 'primary' ? { backgroundImage: 'var(--gradient-brand)', ...style } : style}
            disabled={loading || rest.disabled}
            {...rest}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : Icon ? (
                <Icon className="h-4 w-4 shrink-0" />
            ) : null}
            {children}
        </button>
    );
}

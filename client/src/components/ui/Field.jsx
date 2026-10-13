import { useId } from 'react';

function Label({ htmlFor, children }) {
    return (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
            {children}
        </label>
    );
}

function Hint({ error, hint }) {
    if (error) return <p className="mt-1.5 text-xs text-[var(--color-danger-500)]">{error}</p>;
    if (hint) return <p className="mt-1.5 text-xs text-[var(--text-muted)]">{hint}</p>;
    return null;
}

export function Input({ label, error, hint, icon: Icon, suffix, id, className = '', ...rest }) {
    const autoId = useId();
    const inputId = id || autoId;
    return (
        <div>
            {label && <Label htmlFor={inputId}>{label}</Label>}
            <div className="relative">
                {Icon && (
                    <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                )}
                <input
                    id={inputId}
                    aria-invalid={error ? 'true' : undefined}
                    className={['field', Icon && 'pl-9', suffix && 'pr-9', className].filter(Boolean).join(' ')}
                    {...rest}
                />
                {suffix && <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">{suffix}</span>}
            </div>
            <Hint error={error} hint={hint} />
        </div>
    );
}

export function Textarea({ label, error, hint, id, rows = 4, className = '', ...rest }) {
    const autoId = useId();
    const inputId = id || autoId;
    return (
        <div>
            {label && <Label htmlFor={inputId}>{label}</Label>}
            <textarea
                id={inputId}
                rows={rows}
                aria-invalid={error ? 'true' : undefined}
                className={['field resize-y', className].filter(Boolean).join(' ')}
                {...rest}
            />
            <Hint error={error} hint={hint} />
        </div>
    );
}

export function Select({ label, error, hint, id, children, className = '', ...rest }) {
    const autoId = useId();
    const inputId = id || autoId;
    return (
        <div>
            {label && <Label htmlFor={inputId}>{label}</Label>}
            <select
                id={inputId}
                aria-invalid={error ? 'true' : undefined}
                className={['field appearance-none bg-[length:0] pr-8', className].filter(Boolean).join(' ')}
                {...rest}
            >
                {children}
            </select>
            <Hint error={error} hint={hint} />
        </div>
    );
}

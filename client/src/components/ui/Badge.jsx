const tones = {
    neutral: 'badge-neutral',
    primary: 'badge-primary',
    accent: 'badge-accent',
    info: 'badge-info',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
};

export default function Badge({ tone = 'neutral', icon: Icon, className = '', children }) {
    return (
        <span className={['badge', tones[tone], className].filter(Boolean).join(' ')}>
            {Icon && <Icon className="h-3 w-3" />}
            {children}
        </span>
    );
}

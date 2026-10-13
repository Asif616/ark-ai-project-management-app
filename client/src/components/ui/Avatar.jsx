const sizes = { xs: 20, sm: 28, md: 32, lg: 40, xl: 56 };

export default function Avatar({ user, name, color, size = 'md', ring = 'ring-[var(--bg-card)]', className = '' }) {
    const label = name || user?.name || user?.email || '?';
    const initials = label
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const px = sizes[size] ?? size;
    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ${ring} ${className}`}
            style={{
                width: px,
                height: px,
                fontSize: px * 0.38,
                background: color || user?.avatar_color || 'var(--color-primary-600)',
            }}
            aria-hidden="true"
        >
            {initials}
        </span>
    );
}

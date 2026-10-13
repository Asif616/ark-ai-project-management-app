import { useRef } from 'react';

// Adapted from reactbits.dev/components/spotlight-card
export default function SpotlightCard({ children, className = '', spotlightColor, style, ...rest }) {
    const ref = useRef(null);

    const handleMouseMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
        el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            className={`spotlight-card ${className}`}
            style={{ ...(spotlightColor ? { '--spot': spotlightColor } : null), ...style }}
            {...rest}
        >
            {children}
            <span className="spotlight-card__spot" aria-hidden="true" />
        </div>
    );
}

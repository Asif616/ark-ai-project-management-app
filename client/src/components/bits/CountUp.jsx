import { useEffect, useRef, useState } from 'react';

export default function CountUp({ to, duration = 1.1, decimals = 0, prefix = '', suffix = '', className = '' }) {
    const [value, setValue] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setValue(to);
            return undefined;
        }
        let raf;
        let startedAt;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                observer.disconnect();
                const step = (t) => {
                    if (startedAt === undefined) startedAt = t;
                    const p = Math.min(1, (t - startedAt) / (duration * 1000));
                    setValue(to * (1 - Math.pow(1 - p, 3)));
                    if (p < 1) raf = requestAnimationFrame(step);
                };
                raf = requestAnimationFrame(step);
            },
            { threshold: 0.35 }
        );
        observer.observe(el);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(raf);
        };
    }, [to, duration]);

    return (
        <span ref={ref} className={className}>
            {prefix}
            {value.toFixed(decimals)}
            {suffix}
        </span>
    );
}

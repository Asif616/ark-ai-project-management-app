/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
                accent: {
                    300: '#67e8f9',
                    400: '#22d3ee',
                    500: '#06b6d4',
                    600: '#0891b2',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                card: 'var(--radius-card)',
                control: 'var(--radius-control)',
            },
            boxShadow: {
                card: 'var(--shadow-sm)',
                raised: 'var(--shadow-md)',
                pop: 'var(--shadow-lg)',
                glow: '0 0 0 1px rgba(99,102,241,0.25), 0 8px 30px -8px rgba(99,102,241,0.45)',
                'glow-cyan': '0 0 0 1px rgba(34,211,238,0.25), 0 8px 30px -8px rgba(34,211,238,0.4)',
            },
            keyframes: {
                'aurora-pan': {
                    '0%': { transform: 'translate3d(-8%,-4%,0) scale(1.1) rotate(0deg)' },
                    '50%': { transform: 'translate3d(8%,6%,0) scale(1.3) rotate(180deg)' },
                    '100%': { transform: 'translate3d(-8%,-4%,0) scale(1.1) rotate(360deg)' },
                },
                'float-slow': {
                    '0%,100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-14px)' },
                },
                shimmer: {
                    '100%': { transform: 'translateX(100%)' },
                },
                'pulse-ring': {
                    '0%': { transform: 'scale(0.9)', opacity: '0.7' },
                    '100%': { transform: 'scale(1.6)', opacity: '0' },
                },
            },
            animation: {
                'aurora-pan': 'aurora-pan 26s ease-in-out infinite',
                'float-slow': 'float-slow 7s ease-in-out infinite',
                shimmer: 'shimmer 1.6s linear infinite',
                'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.2,0.6,0.4,1) infinite',
            },
        },
    },
    plugins: [],
}

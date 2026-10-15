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
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                    950: '#022c22',
                },
                accent: {
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
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
                glow: '0 0 0 1px rgba(16,185,129,0.25), 0 8px 30px -8px rgba(16,185,129,0.45)',
                'glow-cyan': '0 0 0 1px rgba(52,211,153,0.25), 0 8px 30px -8px rgba(52,211,153,0.4)',
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

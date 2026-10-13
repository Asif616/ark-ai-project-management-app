// Minimal flat config: core recommended rules only.
// No react/vite plugins yet — add them when a real class of bugs demands it.
import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        ignores: ['dist/', 'node_modules/'],
    },
    {
        // Browser code: tell eslint about the globals vite provides at runtime.
        files: ['src/**/*.{js,jsx}'],
        languageOptions: {
            parserOptions: { ecmaFeatures: { jsx: true } },
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                location: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                fetch: 'readonly',
                URLSearchParams: 'readonly',
                Event: 'readonly',
                CustomEvent: 'readonly',
                console: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                crypto: 'readonly',
                Image: 'readonly',
                IntersectionObserver: 'readonly',
                ResizeObserver: 'readonly',
                performance: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
            },
        },
    },
    {
        files: ['**/*.test.js'],
        languageOptions: {
            // node:test globals without adding eslint-env plugins.
            globals: {
                console: 'readonly',
                process: 'readonly',
                window: 'writable',
                globalThis: 'readonly',
            },
        },
    },
];

import { Suspense, lazy } from 'react';
import { motion } from 'motion/react';
import AtomLogo from '../AtomLogo';

const DitherVeil = lazy(() => import('../bits/DitherVeil'));

export default function AuthLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-[var(--bg-secondary)]">
            <aside
                className="relative hidden w-1/2 flex-col gap-8 overflow-hidden py-10 lg:flex xl:py-14"
                style={{ background: '#000000' }}
            >
                <div className="relative z-10 flex items-center gap-3 px-10 xl:px-14">
                    <img src="/ark-favicon.svg" alt="" className="h-8 w-8" />
                    <span className="font-display text-lg font-semibold tracking-tight text-white">ARK Workspace</span>
                </div>

                <Suspense fallback={<div style={{ flex: 1, minHeight: 0 }} aria-hidden="true" />}>
                    <DitherVeil
                        src="/assets/test.png"
                        fit="contain" /* ink #0a0813 = aside bg, letterbox invisible; cover zoomed glow 1.6x */
                        pattern="floyd"
                        pixelSize={2}
                        inkColor="#000000"
                        paperColor="#f4f1ea"
                        revealRadius={140} 
                        softness={0.6}
                        linger={1}
                        clickBurst={false}
                        style={{ flex: 1, minHeight: 0, height: 'auto' }}
                        wander
                    />
                </Suspense>

                <h1 className="relative z-10 px-10 font-display text-4xl font-semibold leading-[1.05] tracking-tight xl:px-14 xl:text-[3.25rem]">
                    <span className="gradient-text">Plan less.</span>
                    <br />
                    <span className="gradient-text">Ship more.</span>
                </h1>
            </aside>

            <main className="relative flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24 dark:bg-[var(--bg-primary)]">
                <div className="absolute left-6 top-8 flex items-center gap-2 lg:hidden">
                    <AtomLogo className="h-7 w-7 text-primary-500" />
                    <span className="font-display text-base font-semibold tracking-tight text-[var(--text-primary)]">
                        ARK Workspace
                    </span>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="mx-auto w-full max-w-md pt-12 lg:pt-0"
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}

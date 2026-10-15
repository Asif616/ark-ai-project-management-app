import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sun, Moon, Menu, Search } from 'lucide-react';
import Button from './ui/Button';
import SearchBox from './SearchBox';
import NotificationBell from './NotificationBell';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';

const pageTitles = {
    '/': 'Dashboard',
    '/projects': 'Projects',
    '/my-tasks': 'My Tasks',
    '/activity': 'Activity Log',
    '/users': 'Users',
    '/profile': 'Profile',
};

export default function Header({ onMenuClick }) {
    const { dark, toggle } = useTheme();
    const location = useLocation();
    const [mobileSearch, setMobileSearch] = useState(false);

    const pathBase = '/' + (location.pathname.split('/')[1] || '');
    const title = pageTitles[pathBase] || 'Project';

    return (
        <header
            className="sticky top-0 z-20 border-b backdrop-blur-xl transition-theme"
            style={{
                background: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)',
                borderColor: 'var(--border-color)',
            }}
        >
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <Button variant="outline" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Open navigation">
                        <Menu className="h-4 w-4" />
                    </Button>

                    <div className="min-w-0 overflow-hidden">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.h1
                                key={title}
                                initial={{ y: 14, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -14, opacity: 0 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                className="truncate font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]"
                            >
                                {title}
                            </motion.h1>
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <SearchBox className="hidden w-64 md:block" />

                    <Button
                        variant="outline"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setMobileSearch((prev) => !prev)}
                        aria-label={mobileSearch ? 'Close search' : 'Search'}
                    >
                        <Search className="h-4 w-4" />
                    </Button>

                    <NotificationBell />

                    <button
                        onClick={toggle}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-primary-500/10 hover:text-[var(--text-primary)]"
                        aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
                    >
                        {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-primary-500" />}
                    </button>
                </div>
            </div>

            {mobileSearch && (
                <div className="border-t px-4 pb-3 pt-2 md:hidden" style={{ borderColor: 'var(--border-color)' }}>
                    <SearchBox />
                </div>
            )}
        </header>
    );
}

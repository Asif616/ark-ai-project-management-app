import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, FolderKanban, ListChecks, History, Users, LogOut, X } from 'lucide-react';
import AtomLogo from './AtomLogo';
import Avatar from './ui/Avatar';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/my-tasks', icon: ListChecks, label: 'My Tasks' },
    { to: '/activity', icon: History, label: 'Activity Log' },
];

const adminItems = [
    { to: '/users', icon: Users, label: 'Users' },
];

export default function Sidebar({ mobileOpen = false, onClose = () => { } }) {
    const { logout, isAdmin, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col border-r transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{
                borderColor: 'var(--border-color)',
                background:
                    'radial-gradient(120% 45% at 50% 0%, var(--sidebar-glow), transparent 70%), var(--bg-sidebar)',
            }}
        >
            <div className="flex h-16 items-center gap-2.5 border-b px-6" style={{ borderColor: 'var(--border-color)' }}>
                <AtomLogo className="h-6 w-6 shrink-0 text-primary-500" />
                <span className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">ARK</span>
                <button
                    type="button"
                    onClick={onClose}
                    className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Close navigation"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {allItems.map((item) => {
                    const isActive =
                        item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 rounded-lg ring-1 ring-inset ring-primary-400/30"
                                    style={{ backgroundImage: 'var(--sidebar-active)' }}
                                    transition={{ type: 'spring', stiffness: 450, damping: 36 }}
                                />
                            )}
                            <item.icon
                                className={`relative h-[18px] w-[18px] ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
                            />
                            <span className={`relative ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>

            <div className="space-y-2 px-3 pb-4">
                <button
                    type="button"
                    onClick={() => {
                        onClose();
                        navigate('/profile');
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                    <Avatar user={user} size={30} ring="ring-[var(--border-color)]" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{user?.name}</p>
                        <p className="truncate text-xs capitalize text-[var(--text-muted)]">{user?.role}</p>
                    </div>
                </button>
                <button
                    onClick={() => {
                        onClose();
                        logout();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-150 hover:bg-rose-500/10 hover:text-rose-500"
                >
                    <LogOut className="h-[18px] w-[18px]" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

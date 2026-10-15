import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { subscribeDataRefresh, notifyDataRefresh } from '../realtime';
import { timeAgo } from '../format';

// ponytail: 30s polling + existing refresh bus, switch to SSE/websocket when latency matters
const POLL_MS = 30000;

export default function NotificationBell() {
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const ref = useRef(null);

    const fetchItems = () => {
        api.getNotifications().then(setItems).catch(() => {});
    };

    useEffect(() => {
        fetchItems();
        const timer = setInterval(fetchItems, POLL_MS);
        const unsubscribe = subscribeDataRefresh(fetchItems);
        return () => {
            clearInterval(timer);
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const unread = items.filter((n) => !n.is_read).length;

    const onItemClick = async (n) => {
        setOpen(false);
        if (!n.is_read) {
            try {
                await api.markNotificationRead(n.id);
            } catch { /* best effort */ }
        }
        notifyDataRefresh();
        if (n.link) navigate(n.link);
    };

    const markAll = async () => {
        try {
            await api.markAllNotificationsRead();
        } catch { /* best effort */ }
        fetchItems();
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary-500/10"
                style={{ background: 'transparent', color: 'var(--text-secondary)' }}
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
                aria-expanded={open}
            >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <button
                        className="fixed inset-0 z-30 cursor-default"
                        onClick={() => setOpen(false)}
                        aria-label="Close notifications"
                    />
                    <div className="surface absolute right-0 top-11 z-40 w-80 animate-scale-in shadow-pop">
                        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border-color)' }}>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h4>
                            {unread > 0 && (
                                <button
                                    onClick={markAll}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:underline"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {items.length === 0 ? (
                                <p className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
                                    You're all caught up.
                                </p>
                            ) : (
                                items.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => onItemClick(n)}
                                        className="flex w-full items-start gap-2.5 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-primary-500/[0.06]"
                                        style={{ borderColor: 'var(--border-subtle)' }}
                                    >
                                        <span
                                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-transparent' : 'bg-primary-500'}`}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-xs leading-snug text-[var(--text-primary)]">{n.message}</span>
                                            <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">{timeAgo(n.created_at)}</span>
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

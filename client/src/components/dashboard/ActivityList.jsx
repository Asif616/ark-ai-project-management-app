import { timeAgo } from '../../format';

export default function ActivityList({ items }) {
    if (items.length === 0) {
        return <p className="text-xs text-[var(--text-muted)]">No activity yet.</p>;
    }
    return (
        <ul className="space-y-3">
            {items.map((a) => (
                <li key={a.id} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500/70" />
                    <div className="min-w-0">
                        <p className="text-xs leading-snug text-[var(--text-secondary)]">
                            <span className="font-semibold text-[var(--text-primary)]">{a.actor_name || 'System'}</span>{' '}
                            {a.detail}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{timeAgo(a.created_at)}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}

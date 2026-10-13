// Server stores naive UTC datetimes (sqlite strips tz); treat them as UTC.
function toDate(value) {
    const s = String(value);
    const hasTz = s.includes('Z') || /[+-]\d\d:\d\d$/.test(s);
    return new Date(hasTz ? s : `${s.replace(' ', 'T')}Z`);
}

export function timeAgo(value) {
    const then = toDate(value).getTime();
    if (Number.isNaN(then)) return '';
    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function isOverdue(task) {
    if (!task.due_date || task.status === 'done') return false;
    const [y, m, d] = task.due_date.split('-').map(Number);
    const due = new Date(y, m - 1, d, 23, 59, 59);
    return due.getTime() < Date.now();
}

export function formatDate(value) {
    if (!value) return '';
    const [y, m, d] = String(value).split('-').map(Number);
    if (!y || !m || !d) return value;
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

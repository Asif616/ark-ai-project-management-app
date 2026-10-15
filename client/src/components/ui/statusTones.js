export const statusMeta = {
    todo: { label: 'To Do', tone: 'neutral', accent: '#94a3b8' },
    in_progress: { label: 'In Progress', tone: 'info', accent: '#38bdf8' },
    review: { label: 'Review', tone: 'warning', accent: '#fbbf24' },
    done: { label: 'Done', tone: 'success', accent: '#10b981' },
    active: { label: 'Active', tone: 'info', accent: '#38bdf8', tile: 'rgba(56,189,248,0.14)' },
    completed: { label: 'Completed', tone: 'success', accent: '#10b981', tile: 'rgba(16,185,129,0.16)' },
    on_hold: { label: 'On Hold', tone: 'warning', accent: '#fbbf24', tile: 'rgba(251,191,36,0.16)' },
};

export const priorityTone = {
    low: 'neutral',
    medium: 'warning',
    high: 'danger',
};

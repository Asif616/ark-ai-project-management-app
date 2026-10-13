import { useEffect, useRef, useState } from 'react';
import { FolderKanban, ListTodo, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { subscribeDataRefresh } from '../realtime';

export default function SearchBox({ className = '' }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState({ projects: [], tasks: [] });
    const loadedRef = useRef(false);
    const navigate = useNavigate();

    const load = async () => {
        if (loadedRef.current) return;
        loadedRef.current = true;
        try {
            const [projects, tasks] = await Promise.all([api.getProjects(), api.getTasks()]);
            setResults({ projects, tasks });
        } catch {
            loadedRef.current = false;
        }
    };

    useEffect(() => {
        load();
        // cache only invalidated by data refresh (task/project mutations)
        return subscribeDataRefresh(() => { loadedRef.current = false; });
    }, []);

    const q = query.trim().toLowerCase();
    const matchedProjects = q
        ? results.projects.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 4)
        : [];
    const matchedTasks = q
        ? results.tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 5)
        : [];
    const showDropdown = open && q.length > 0;

    const go = (path) => {
        setQuery('');
        setOpen(false);
        navigate(path);
    };

    return (
        <div className={`relative ${className}`}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                    load();
                }}
                onFocus={() => {
                    setOpen(true);
                    load();
                }}
                onBlur={() => setOpen(false)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') setOpen(false);
                }}
                placeholder="Search projects and tasks…"
                className="field h-9 w-full pl-9 text-sm"
                name="q"
                aria-label="Search projects and tasks"
            />

            {showDropdown && (
                <div className="surface absolute left-0 top-11 z-40 w-full min-w-64 animate-scale-in overflow-hidden shadow-pop">
                    {matchedProjects.length === 0 && matchedTasks.length === 0 ? (
                        <p className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">No matches for “{query}”.</p>
                    ) : (
                        <>
                            {matchedProjects.map((p) => (
                                <button
                                    key={`p-${p.id}`}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        go(`/projects/${p.id}`);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-primary-500/[0.08]"
                                >
                                    <FolderKanban className="h-3.5 w-3.5 shrink-0 text-primary-500" />
                                    <span className="truncate text-[var(--text-primary)]">{p.name}</span>
                                    <span className="ml-auto shrink-0 text-[11px] text-[var(--text-muted)]">Project</span>
                                </button>
                            ))}
                            {matchedTasks.map((t) => (
                                <button
                                    key={`t-${t.id}`}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        go(`/projects/${t.project_id}`);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-primary-500/[0.08]"
                                >
                                    <ListTodo className="h-3.5 w-3.5 shrink-0 text-accent-400" />
                                    <span className="truncate text-[var(--text-primary)]">{t.title}</span>
                                    <span className="ml-auto shrink-0 text-[11px] text-[var(--text-muted)]">Task</span>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

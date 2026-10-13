import { useEffect, useState } from 'react';
import { ListChecks, CalendarDays } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { subscribeDataRefresh } from '../realtime';
import { isOverdue, formatDate } from '../format';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import TaskModal from '../components/TaskModal';
import { Skeleton, EmptyState } from '../components/ui/Loading';
import { statusMeta, priorityTone } from '../components/ui/statusTones';

function dueRank(task) {
    if (!task.due_date) return Number.MAX_SAFE_INTEGER;
    return new Date(`${task.due_date}T00:00:00`).getTime();
}

export default function MyTasks() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [selected, setSelected] = useState(null);

    const fetchData = async () => {
        try {
            const [taskData, projectData, userData] = await Promise.all([
                api.getTasks({ assignee_id: user?.id }),
                api.getProjects(),
                api.getUsers(),
            ]);
            setTasks(taskData);
            setProjects(projectData);
            setUsers(userData);
        } catch {
            setPageError('Unable to load your tasks right now. Please refresh and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);
    useEffect(() => subscribeDataRefresh(fetchData), []);

    if (loading) {
        return (
            <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="surface p-4">
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                ))}
            </div>
        );
    }

    const projectName = (id) => projects.find((p) => p.id === id)?.name || 'Unknown project';
    const sorted = [...tasks].sort((a, b) => {
        const ao = isOverdue(a) ? 0 : 1;
        const bo = isOverdue(b) ? 0 : 1;
        if (ao !== bo) return ao - bo;
        return dueRank(a) - dueRank(b);
    });
    const overdueCount = tasks.filter(isOverdue).length;
    const active = sorted.filter((t) => t.status !== 'done');
    const completed = sorted.filter((t) => t.status === 'done');

    const TaskRow = ({ task }) => {
        const overdue = isOverdue(task);
        return (
            <button
                key={task.id}
                onClick={() => setSelected(task)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary-500/[0.05]"
                style={{ borderColor: 'var(--border-subtle)' }}
            >
                <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${task.status === 'done' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                        {task.title}
                    </p>
                    <p className="truncate text-xs text-[var(--text-muted)]">{projectName(task.project_id)}</p>
                </div>

                <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
                <Badge tone={statusMeta[task.status].tone}>{(statusMeta[task.status] || {}).label || task.status}</Badge>

                <span
                    className={`hidden w-20 shrink-0 items-center justify-end gap-1 text-xs sm:inline-flex ${overdue ? 'font-semibold text-rose-500' : 'text-[var(--text-muted)]'}`}
                >
                    {task.due_date && <CalendarDays className="h-3.5 w-3.5" />}
                    {task.due_date ? formatDate(task.due_date) : '—'}
                </span>
            </button>
        );
    };

    const TaskSection = ({ title, items, emptyHint }) => (
        <div>
            <h2 className="mb-2 font-display text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
            {items.length === 0 ? (
                <p className="surface px-4 py-3 text-xs text-[var(--text-muted)]">{emptyHint}</p>
            ) : (
                <div className="surface divide-y" style={{ borderColor: 'var(--border-color)' }}>
                    {items.map((task) => (
                        <TaskRow key={task.id} task={task} />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            {pageError && <Alert tone="danger">{pageError}</Alert>}

            <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-secondary)]">
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
                    {overdueCount > 0 && (
                        <span className="ml-2 font-medium text-rose-500">{overdueCount} overdue</span>
                    )}
                </p>
            </div>

            {sorted.length === 0 ? (
                <div className="surface">
                    <EmptyState
                        icon={ListChecks}
                        title="No tasks assigned to you"
                        hint="Tasks assigned to you from any project will show up here."
                    />
                </div>
            ) : (
                <>
                    <TaskSection
                        title={`Active (${active.length})`}
                        items={active}
                        emptyHint="No active tasks — you're all caught up."
                    />
                    {completed.length > 0 && (
                        <TaskSection
                            title={`Completed (${completed.length})`}
                            items={completed}
                            emptyHint=""
                        />
                    )}
                </>
            )}

            <TaskModal
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                task={selected}
                projectId={selected?.project_id}
                users={users}
                onSaved={fetchData}
            />
        </div>
    );
}

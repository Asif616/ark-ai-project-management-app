import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../api';
import { subscribeDataRefresh } from '../realtime';
import { isOverdue, formatDate } from '../format';
import { useToast } from '../components/ui/Toast';
import { Plus, ArrowLeft, Flag, Inbox, CalendarDays } from 'lucide-react';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import TaskModal from '../components/TaskModal';
import { Skeleton } from '../components/ui/Loading';
import { priorityTone, statusMeta } from '../components/ui/statusTones';

const COLUMNS = ['todo', 'in_progress', 'review', 'done'].map((key) => ({ key, ...statusMeta[key] }));

export default function KanbanBoard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | 'create' | task
    const [pageError, setPageError] = useState('');
    const [draggedTask, setDraggedTask] = useState(null);

    const fetchData = async () => {
        try {
            const [proj, tasksData, usersData] = await Promise.all([
                api.getProject(id),
                api.getTasks({ project_id: id }),
                api.getUsers(),
            ]);
            setProject(proj);
            setTasks(tasksData);
            setUsers(usersData);
        } catch {
            setPageError('Unable to load board data right now. Please refresh and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);
    useEffect(() => subscribeDataRefresh(fetchData), [id]);

    const onDragStart = (e, task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    };

    const onDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        setDraggedTask(null);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('kanban-column-over');
    };

    const onDragLeave = (e) => {
        e.currentTarget.classList.remove('kanban-column-over');
    };

    const onDrop = async (e, status) => {
        e.preventDefault();
        e.currentTarget.classList.remove('kanban-column-over');
        if (!draggedTask || draggedTask.status === status) return;

        const previous = draggedTask.status;
        setTasks((prev) => prev.map((t) => (t.id === draggedTask.id ? { ...t, status } : t)));

        try {
            await api.updateTask(draggedTask.id, { status });
        } catch {
            setTasks((prev) => prev.map((t) => (t.id === draggedTask.id ? { ...t, status: previous } : t)));
            toast('Could not move task', 'danger');
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {COLUMNS.map((c) => (
                    <div key={c.key} className="surface min-h-[300px] p-3">
                        <Skeleton className="mb-4 h-4 w-24" />
                        <div className="space-y-2">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!project) {
        return <p className="py-12 text-center text-sm text-[var(--text-muted)]">Project not found</p>;
    }

    return (
        <div>
            {pageError && (
                <div className="mb-4">
                    <Alert tone="danger">{pageError}</Alert>
                </div>
            )}

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => navigate('/projects')} aria-label="Back to projects">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0">
                        <h2 className="truncate font-display text-base font-semibold text-[var(--text-primary)]">
                            {project.name}
                        </h2>
                        <p className="text-xs text-[var(--text-muted)]">
                            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <Button icon={Plus} onClick={() => setModal('create')} className="w-full sm:w-auto">
                    Add Task
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {COLUMNS.map((col) => {
                    const colTasks = tasks.filter((t) => t.status === col.key);

                    return (
                        <div
                            key={col.key}
                            className="surface min-h-[300px] p-3 transition-all duration-200"
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={(e) => onDrop(e, col.key)}
                        >
                            <div className="mb-3 flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.accent }} />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                                        {col.label}
                                    </span>
                                </div>
                                <span className="rounded-md bg-[var(--bg-secondary)] px-1.5 py-0.5 text-xs font-medium text-[var(--text-muted)]">
                                    {colTasks.length}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {colTasks.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        layoutId={`task-${task.id}`}
                                        transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                                    >
                                        <div
                                            draggable
                                            onDragStart={(e) => onDragStart(e, task)}
                                            onDragEnd={onDragEnd}
                                            onClick={() => setModal(task)}
                                            className={`group cursor-grab rounded-lg border bg-[var(--bg-primary)] p-3 shadow-[var(--shadow-sm)] transition-all duration-150 hover:border-primary-500/40 active:cursor-grabbing ${isOverdue(task) ? 'border-rose-500/50' : 'border-[var(--border-color)]'}`}
                                        >
                                            <div className="mb-2 flex items-start justify-between">
                                                <p className="mr-2 flex-1 text-sm font-medium text-[var(--text-primary)]">
                                                    {task.title}
                                                </p>
                                            </div>

                                            {task.description && (
                                                <p className="mb-2.5 line-clamp-2 text-xs text-[var(--text-muted)]">
                                                    {task.description}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <Badge tone={priorityTone[task.priority]} icon={Flag}>
                                                        {task.priority}
                                                    </Badge>
                                                    {task.due_date && (
                                                        <span
                                                            className={`inline-flex items-center gap-1 text-[11px] ${isOverdue(task) ? 'font-semibold text-rose-500' : 'text-[var(--text-muted)]'}`}
                                                        >
                                                            <CalendarDays className="h-3 w-3" />
                                                            {formatDate(task.due_date)}
                                                        </span>
                                                    )}
                                                </div>
                                                {task.assignee_name && (
                                                    <Avatar
                                                        name={task.assignee_name}
                                                        color={task.assignee_avatar_color}
                                                        size={20}
                                                        ring="ring-[var(--bg-primary)]"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {colTasks.length === 0 && (
                                    <div className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-[var(--border-color)] py-6 text-center text-xs text-[var(--text-muted)]">
                                        <Inbox className="h-4 w-4 opacity-60" />
                                        Drop tasks here
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <TaskModal
                open={modal !== null}
                onClose={() => setModal(null)}
                task={modal && modal !== 'create' ? modal : null}
                projectId={id}
                users={users}
                onSaved={fetchData}
            />
        </div>
    );
}

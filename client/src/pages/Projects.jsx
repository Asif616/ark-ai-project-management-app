import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { subscribeDataRefresh } from '../realtime';
import { useToast } from '../components/ui/Toast';
import { Plus, FolderKanban, ListTodo, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import SpotlightCard from '../components/bits/SpotlightCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import { Input, Textarea, Select } from '../components/ui/Field';
import { Skeleton, EmptyState } from '../components/ui/Loading';
import { statusMeta } from '../components/ui/statusTones';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
};

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');
    const [pageError, setPageError] = useState('');
    const [menuOpen, setMenuOpen] = useState(null);
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [form, setForm] = useState({ name: '', description: '', status: 'active' });

    const fetchProjects = () => {
        api.getProjects()
            .then(setProjects)
            .catch(() => setPageError('Unable to load projects right now. Please refresh and try again.'))
            .finally(() => setLoading(false));
    };

    useEffect(fetchProjects, []);
    useEffect(() => subscribeDataRefresh(fetchProjects), []);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', description: '', status: 'active' });
        setError('');
        setModalOpen(true);
    };

    const openEdit = (proj) => {
        setEditing(proj);
        setForm({ name: proj.name, description: proj.description, status: proj.status });
        setError('');
        setMenuOpen(null);
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editing) {
                await api.updateProject(editing.id, form);
                toast('Project updated');
            } else {
                await api.createProject(form);
                toast('Project created');
            }
            setModalOpen(false);
            fetchProjects();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this project and all its tasks?')) return;
        try {
            await api.deleteProject(id);
            setMenuOpen(null);
            toast('Project deleted', 'danger');
            fetchProjects();
        } catch (err) {
            toast(err.message, 'danger');
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="surface p-5">
                        <Skeleton className="mb-4 h-9 w-9 rounded-lg" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="mt-2 h-3 w-full" />
                        <Skeleton className="mt-1.5 h-3 w-4/5" />
                        <div className="mt-4 flex justify-between">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-4 w-14" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--text-secondary)]">
                    {projects.length} project{projects.length !== 1 ? 's' : ''}
                </p>
                <Button icon={Plus} onClick={openCreate} className="w-full sm:w-auto">
                    New Project
                </Button>
            </div>

            {pageError && <Alert tone="danger">{pageError}</Alert>}

            {projects.length === 0 ? (
                <div className="surface">
                    <EmptyState
                        icon={FolderKanban}
                        title="No projects yet"
                        hint="Create your first project to get started."
                        action={
                            <Button icon={Plus} onClick={openCreate} className="mt-2">
                                New Project
                            </Button>
                        }
                    />
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {projects.map((proj) => {
                        const sc = statusMeta[proj.status] || statusMeta.active;
                        return (
                            <motion.div key={proj.id} variants={item}>
                                <SpotlightCard
                                    className="surface surface-hover group h-full cursor-pointer p-5"
                                    style={{ borderTop: `2px solid ${sc.accent}` }}
                                    onClick={() => navigate(`/projects/${proj.id}`)}
                                >
                                    <div className="mb-3 flex items-start justify-between">
                                        <div
                                            className="flex h-9 w-9 items-center justify-center rounded-lg"
                                            style={{ background: sc.tile, color: sc.accent }}
                                        >
                                            <FolderKanban className="h-4 w-4" />
                                        </div>
                                        {isAdmin && (
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMenuOpen(menuOpen === proj.id ? null : proj.id);
                                                    }}
                                                    className="rounded-lg p-1 text-[var(--text-muted)] opacity-100 transition-all hover:bg-primary-500/10 sm:opacity-0 sm:group-hover:opacity-100"
                                                    aria-label={`Open actions for ${proj.name}`}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                                {menuOpen === proj.id && (
                                                    <div className="surface absolute right-0 top-8 z-20 w-36 animate-scale-in py-1 shadow-pop">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEdit(proj);
                                                            }}
                                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-primary)] transition-colors hover:bg-primary-500/10"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" /> Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(proj.id);
                                                            }}
                                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-danger-500)] transition-colors hover:bg-[rgba(var(--color-danger-rgb),0.12)]"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">{proj.name}</h3>
                                    <p className="mb-3 line-clamp-2 text-xs text-[var(--text-muted)]">
                                        {proj.description || 'No description'}
                                    </p>

                                    <div className="mb-3">
                                        <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                                            <span>Progress</span>
                                            <span className="font-medium text-[var(--text-secondary)]">{proj.progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${proj.progress}%`, backgroundColor: sc.accent }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Badge tone={statusMeta[proj.status].tone}>
                                            {(statusMeta[proj.status] || {}).label || proj.status}
                                        </Badge>
                                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                            <ListTodo className="h-3.5 w-3.5" />
                                            {proj.task_count} task{proj.task_count !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project' : 'New Project'}>
                {error && (
                    <div className="mb-4">
                        <Alert tone="danger">{error}</Alert>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Name"
                        id="project-name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Project name"
                        required
                    />
                    <Textarea
                        label="Description"
                        id="project-description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        placeholder="Brief description…"
                    />
                    {editing && (
                        <Select
                            label="Status"
                            id="project-status"
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="on_hold">On Hold</option>
                        </Select>
                    )}
                    <Button type="submit" className="w-full" size="lg">
                        {editing ? 'Save Changes' : 'Create Project'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}

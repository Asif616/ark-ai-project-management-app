import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ui/Toast';
import { timeAgo } from '../format';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Alert from './ui/Alert';
import Avatar from './ui/Avatar';
import { Input, Textarea, Select } from './ui/Field';

const EMPTY_FORM = { title: '', description: '', priority: 'medium', assignee_id: '', status: 'todo', due_date: '' };

export default function TaskModal({ open, onClose, task, projectId, users, onSaved }) {
    const { isAdmin, user } = useAuth();
    const { toast } = useToast();
    const isEdit = Boolean(task);

    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentBody, setCommentBody] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    useEffect(() => {
        if (!open) return;
        setError('');
        if (task) {
            setForm({
                title: task.title,
                description: task.description || '',
                priority: task.priority,
                assignee_id: task.assignee_id ? String(task.assignee_id) : '',
                status: task.status,
                due_date: task.due_date || '',
            });
            api.getComments(task.id).then(setComments).catch(() => setComments([]));
        } else {
            setForm(EMPTY_FORM);
            setComments([]);
        }
    }, [open, task]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const payload = {
                title: form.title,
                description: form.description,
                priority: form.priority,
                assignee_id: form.assignee_id ? parseInt(form.assignee_id, 10) : null,
                due_date: form.due_date || null,
                ...(isEdit ? { status: form.status } : {}),
            };
            if (isEdit) {
                await api.updateTask(task.id, payload);
                toast('Task updated');
            } else {
                await api.createTask({ ...payload, project_id: parseInt(projectId, 10) });
                toast('Task created');
            }
            onClose();
            onSaved();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this task?')) return;
        try {
            await api.deleteTask(task.id);
            toast('Task deleted', 'danger');
            onClose();
            onSaved();
        } catch (err) {
            toast(err.message, 'danger');
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        const body = commentBody.trim();
        if (!body) return;
        setPostingComment(true);
        try {
            const created = await api.createComment(task.id, { body });
            setComments((prev) => [...prev, created]);
            setCommentBody('');
        } catch (err) {
            toast(err.message, 'danger');
        } finally {
            setPostingComment(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={isEdit ? 'Task Details' : 'New Task'}>
            {error && (
                <div className="mb-4">
                    <Alert tone="danger">{error}</Alert>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Title"
                    id="task-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Task title"
                    required
                />
                <Textarea
                    label="Description"
                    id="task-description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Task details…"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {isEdit && (
                        <Select
                            label="Status"
                            id="task-status"
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                        </Select>
                    )}
                    <Select
                        label="Priority"
                        id="task-priority"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </Select>
                    <Select
                        label="Assignee"
                        id="task-assignee"
                        value={form.assignee_id}
                        onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
                    >
                        <option value="">Unassigned</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </Select>
                    <Input
                        label="Due date"
                        id="task-due"
                        type="date"
                        value={form.due_date}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button type="submit" size="lg" className="flex-1" disabled={saving}>
                        {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
                    </Button>
                    {isEdit && isAdmin && (
                        <Button
                            type="button"
                            variant="danger"
                            size="lg"
                            onClick={handleDelete}
                            aria-label="Delete task"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </form>

            {isEdit && (
                <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                    <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        Comments {comments.length > 0 && <span className="text-[var(--text-muted)]">({comments.length})</span>}
                    </h4>

                    <div className="max-h-52 space-y-3 overflow-y-auto">
                        {comments.length === 0 && (
                            <p className="text-xs text-[var(--text-muted)]">No comments yet.</p>
                        )}
                        {comments.map((c) => (
                            <div key={c.id} className="flex items-start gap-2">
                                <Avatar name={c.author_name} color={c.author_avatar_color} size={24} ring="ring-[var(--bg-card)]" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs">
                                        <span className="font-semibold text-[var(--text-primary)]">{c.author_name}</span>{' '}
                                        <span className="text-[var(--text-muted)]">{timeAgo(c.created_at)}</span>
                                    </p>
                                    <p className="whitespace-pre-wrap break-words text-sm text-[var(--text-secondary)]">{c.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleComment} className="mt-3 flex items-end gap-2">
                        <Textarea
                            id="comment-body"
                            rows={2}
                            value={commentBody}
                            onChange={(e) => setCommentBody(e.target.value)}
                            placeholder={user ? `Comment as ${user.name}…` : 'Add a comment…'}
                            className="text-sm"
                        />
                        <Button type="submit" disabled={postingComment || !commentBody.trim()} className="mb-0.5 shrink-0">
                            Post
                        </Button>
                    </form>
                </div>
            )}
        </Modal>
    );
}

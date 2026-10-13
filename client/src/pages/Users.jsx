import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { subscribeDataRefresh } from '../realtime';
import { useToast } from '../components/ui/Toast';
import { Plus, Pencil, Trash2, Shield, Search, Copy, Shuffle, Users2 } from 'lucide-react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Input, Select } from '../components/ui/Field';
import { Skeleton, EmptyState } from '../components/ui/Loading';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');
    const [pageError, setPageError] = useState('');
    const [search, setSearch] = useState('');
    const { isAdmin } = useAuth();
    const { toast } = useToast();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
        avatar_color: '#6366f1',
    });

    const generateTempPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
        const picks = crypto.getRandomValues(new Uint32Array(14));
        setForm((prev) => ({
            ...prev,
            password: [...picks].map((n) => chars[n % chars.length]).join(''),
        }));
        toast('Temporary password generated');
    };

    const copyTempPassword = async () => {
        if (!form.password) return;
        try {
            await navigator.clipboard.writeText(form.password);
            toast('Temporary password copied');
        } catch {
            toast('Copy failed — please copy manually', 'danger');
        }
    };

    const fetchUsers = () => {
        api.getUsers()
            .then(setUsers)
            .catch(() => setPageError('Unable to load users right now. Please refresh and try again.'))
            .finally(() => setLoading(false));
    };

    useEffect(fetchUsers, []);
    useEffect(() => subscribeDataRefresh(fetchUsers), []);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', email: '', password: '', role: 'user', avatar_color: '#6366f1' });
        setError('');
        setModalOpen(true);
    };

    const openEdit = (user) => {
        setEditing(user);
        setForm({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            avatar_color: user.avatar_color,
        });
        setError('');
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editing) {
                await api.updateUser(editing.id, {
                    name: form.name,
                    email: form.email,
                    role: form.role,
                    avatar_color: form.avatar_color,
                });
                toast('User updated');
            } else {
                if (!form.password || form.password.length < 8) {
                    throw new Error('Temporary password must be at least 8 characters');
                }
                await api.createUser(form);
                toast('User created');
            }
            setModalOpen(false);
            fetchUsers();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.deleteUser(id);
            toast('User deleted', 'danger');
            fetchUsers();
        } catch (err) {
            toast(err.message, 'danger');
        }
    };

    const filtered = users.filter(
        (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="surface overflow-hidden">
                <div className="space-y-3 p-5">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="ml-auto h-4 w-40" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:w-64">
                    <Input icon={Search} type="search" placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {isAdmin && (
                    <Button icon={Plus} onClick={openCreate} className="w-full sm:w-auto">
                        Add User
                    </Button>
                )}
            </div>

            {pageError && <Alert tone="danger">{pageError}</Alert>}

            <div className="surface overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
                                <th className="px-5 py-3 font-medium">User</th>
                                <th className="px-5 py-3 font-medium">Email</th>
                                <th className="px-5 py-3 font-medium">Role</th>
                                <th className="px-5 py-3 font-medium">Joined</th>
                                {isAdmin && <th className="px-5 py-3 text-right font-medium">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b border-[var(--border-subtle)] transition-colors last:border-0 hover:bg-primary-500/[0.05]"
                                >
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar user={user} size={32} />
                                            <span className="font-medium text-[var(--text-primary)]">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-[var(--text-secondary)]">{user.email}</td>
                                    <td className="px-5 py-3">
                                        <Badge tone={user.role === 'admin' ? 'primary' : 'neutral'} icon={user.role === 'admin' ? Shield : undefined}>
                                            {user.role === 'admin' ? 'Admin' : 'User'}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-3 text-[var(--text-muted)]">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(user)} aria-label={`Edit ${user.name}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-[var(--color-danger-500)] hover:bg-[rgba(var(--color-danger-rgb),0.12)]"
                                                    onClick={() => handleDelete(user.id)}
                                                    aria-label={`Delete ${user.name}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 5 : 4}>
                                        <EmptyState
                                            icon={Users2}
                                            title="No users found"
                                            hint={search ? `Nothing matches “${search}”.` : 'Add your first team member.'}
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'}>
                {error && (
                    <div className="mb-4">
                        <Alert tone="danger">{error}</Alert>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Name"
                        id="user-name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Email"
                        id="user-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                    />
                    {!editing && (
                        <div>
                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                <label htmlFor="user-password" className="block text-sm font-medium text-[var(--text-secondary)]">
                                    Temporary Password
                                </label>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" icon={Shuffle} onClick={generateTempPassword}>
                                        Generate
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={Copy}
                                        onClick={copyTempPassword}
                                        disabled={!form.password}
                                    >
                                        Copy
                                    </Button>
                                </div>
                            </div>
                            <input
                                id="user-password"
                                type="text"
                                className="field"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                minLength={8}
                                required
                                placeholder="Generate or type a temporary password"
                            />
                        </div>
                    )}
                    <Select
                        label="Role"
                        id="user-role"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </Select>
                    <Button type="submit" size="lg" className="w-full">
                        {editing ? 'Save Changes' : 'Create User'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
}

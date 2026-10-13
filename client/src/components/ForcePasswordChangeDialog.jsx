import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Modal from './ui/Modal';
import Alert from './ui/Alert';
import Button from './ui/Button';
import { Input } from './ui/Field';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function ForcePasswordChangeDialog() {
    const { user, refreshUser, resetPassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!user?.must_change_password) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(password);
            try {
                await api.clearPasswordChanged();
            } catch {
                // Flag already cleared or backend unreachable for this call;
                // password itself was updated, so continue into the app.
            }
            await refreshUser();
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open title="Set a new password" dismissable={false}>
            <p className="mb-5 text-sm text-[var(--text-muted)]">
                You are using a temporary password. Choose a new one to continue.
            </p>

            {error && (
                <div className="mb-4">
                    <Alert tone="danger">{error}</Alert>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="New password"
                    id="force-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                            icon={Lock}
                            placeholder="Enter new password"
                            minLength={8}
                            required
                            suffix={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            }
                        />
                        <Input
                            label="Confirm password"
                            id="force-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            icon={Lock}
                            placeholder="Repeat new password"
                            minLength={8}
                            required
                            suffix={
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((p) => !p)}
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            }
                        />

                <Button type="submit" size="lg" className="w-full" loading={loading}>
                    {loading ? 'Updating…' : 'Update password'}
                </Button>
            </form>
        </Modal>
    );
}

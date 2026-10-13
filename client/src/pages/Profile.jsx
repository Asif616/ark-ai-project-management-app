import { useState } from 'react';
import { Eye, EyeOff, Lock, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Field';

export default function Profile() {
    const { user, resetPassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const nextPassword = password.trim();
        if (nextPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (nextPassword !== confirmPassword.trim()) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(nextPassword);
            setSuccess('Password updated successfully.');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.message || 'Unable to update password right now.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl space-y-5"
        >
            <p className="text-sm text-[var(--text-secondary)]">
                View your account details and update your password.
            </p>

            <section className="surface p-5 sm:p-6">
                <div className="flex items-center gap-4">
                    <Avatar user={user} size={56} />
                    <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[var(--text-primary)]">
                            {user?.name || 'User'}
                        </p>
                        <p className="truncate text-sm text-[var(--text-secondary)]">{user?.email || 'No email'}</p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                        ['Name', user?.name],
                        ['Email', user?.email],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">{label}</span>
                            <div
                                className="truncate rounded-control border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
                                title={value || ''}
                            >
                                {value || '-'}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="surface p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-[var(--text-secondary)]" />
                    <h2 className="text-base font-semibold text-[var(--text-primary)]">Change Password</h2>
                </div>

                <div className="space-y-3">
                    {error && <Alert tone="danger">{error}</Alert>}
                    {success && <Alert tone="success">{success}</Alert>}
                </div>

                <form onSubmit={handlePasswordSave} className="mt-4 space-y-4">
                    <Input
                        label="New Password"
                        id="profile-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        icon={Lock}
                        minLength={8}
                        required
                        placeholder="Enter new password"
                        suffix={
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        }
                    />
                    <Input
                        label="Confirm New Password"
                        id="profile-confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        icon={Lock}
                        minLength={8}
                        required
                        placeholder="Repeat new password"
                    />

                    <Button type="submit" loading={loading}>
                        {loading ? 'Saving…' : 'Save'}
                    </Button>
                </form>
            </section>
        </motion.div>
    );
}

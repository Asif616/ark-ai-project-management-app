import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import AtomLogo from '../components/AtomLogo';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { supabase } from '../supabase';

const RECOVERY_KEY = 'ark_pw_recovery';

function isRecoverySession() {
    try {
        return sessionStorage.getItem(RECOVERY_KEY) === '1';
    } catch {
        return false;
    }
}

function markRecoverySession() {
    try {
        sessionStorage.setItem(RECOVERY_KEY, '1');
    } catch {
        // Private mode etc. — the live PASSWORD_RECOVERY event still gates this visit.
    }
}

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    const [checking, setChecking] = useState(true);
    const { user, loading: authLoading, resetPassword } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            const { data } = await supabase.auth.getSession();
            if (!mounted) return;
            setReady(Boolean(data.session) && isRecoverySession());
            setChecking(false);
        };

        init();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;
            if (event === 'PASSWORD_RECOVERY') {
                markRecoverySession();
            }
            if (event === 'PASSWORD_RECOVERY' || (session && isRecoverySession())) {
                setReady(true);
                setChecking(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

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
                // password itself was updated, so continue to sign-in.
            }
            setSuccess('Password updated successfully. Redirecting to sign in…');
            try {
                sessionStorage.removeItem(RECOVERY_KEY);
            } catch {
                // Non-fatal; the link flow already completed.
            }
            await supabase.auth.signOut();
            setTimeout(() => navigate('/login'), 1200);
        } catch (err) {
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-secondary)] p-4">
            <div className="auth-grid" aria-hidden="true" />

            <div className="relative mx-auto w-full max-w-md">
                <div className="mb-8 flex items-center gap-2">
                    <AtomLogo className="h-7 w-7 text-primary-500" />
                    <span className="font-display text-base font-semibold tracking-tight text-[var(--text-primary)]">
                        ARK Workspace
                    </span>
                </div>

                <Link
                    to="/login"
                    className="mb-6 inline-flex items-center text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                </Link>

                <div className="surface-glass p-6 sm:p-8">
                    <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                        Set a new password
                    </h1>
                    <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                        Choose a strong password for your account.
                    </p>

                    <div className="mt-5 space-y-3">
                        {success && <Alert tone="success">{success}</Alert>}
                        {error && <Alert tone="danger">{error}</Alert>}
                    </div>

                    {checking || authLoading ? (
                        <p className="mt-5 text-sm text-[var(--text-muted)]">Checking reset session…</p>
                    ) : !ready ? (
                        user ? (
                            <Navigate to="/" replace />
                        ) : (
                            <div className="mt-5">
                                <Alert tone="warning">This reset link is invalid or expired. Request a new one.</Alert>
                                <Link
                                    to="/forgot-password"
                                    className="mt-3 inline-block text-sm font-medium text-primary-500 transition-colors hover:text-accent-500 dark:text-primary-400 dark:hover:text-accent-400"
                                >
                                    Request new reset link
                                </Link>
                            </div>
                        )
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            <Input
                                label="New password"
                                id="reset-password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                    icon={Lock}
                                    minLength={8}
                                    required
                                />
                                <Input
                                    label="Confirm password"
                                    id="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    icon={Lock}
                                    placeholder="Repeat new password"
                                    minLength={8}
                                    required
                                />

                            <Button type="submit" size="lg" className="w-full" loading={loading}>
                                {loading ? 'Updating…' : 'Update password'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Input } from '../components/ui/Field';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const { forgotPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await forgotPassword(email);
            setSent(true);
        } catch (err) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Link
                to="/login"
                className="mb-6 inline-flex items-center text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
            </Link>

            <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Reset password
            </h1>
            <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                Enter your email and we'll send you a recovery link.
            </p>

            <div className="mt-5 space-y-3">
                {sent && (
                    <Alert tone="success">If an account exists, a reset email has been sent. Check your inbox.</Alert>
                )}
                {error && <Alert tone="danger">{error}</Alert>}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <Input
                    label="Email"
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    icon={Mail}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" loading={loading} disabled={sent} size="lg" className="w-full">
                    {loading ? 'Sending…' : 'Send reset link'}
                </Button>
            </form>
        </AuthLayout>
    );
}

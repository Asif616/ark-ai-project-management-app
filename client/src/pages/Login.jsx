import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { Input } from '../components/ui/Field';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="mb-8 text-center lg:text-left">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    Welcome back
                </h1>
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">Sign in to continue to your workspace</p>
            </div>

            <div className="space-y-3">
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

                <div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
                            Password
                        </label>
                        <Link
                            to="/forgot-password"
                            className="mb-1.5 text-sm font-medium text-primary-500 transition-colors hover:text-accent-500 dark:text-primary-400 dark:hover:text-accent-400"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        icon={Lock}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                </div>

                <Button type="submit" loading={loading} size="lg" className="w-full">
                    {loading ? 'Signing in…' : 'Log in'}
                </Button>
            </form>
        </AuthLayout>
    );
}

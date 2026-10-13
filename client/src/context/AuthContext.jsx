import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import { supabase } from '../supabase';

const AuthContext = createContext();

function mapAuthError(error, action) {
    const code = String(error?.code || '').toLowerCase();
    const message = String(error?.message || '').toLowerCase();

    if (code === 'over_email_send_rate_limit' || message.includes('email rate limit')) {
        // Admin detail stays in the console; the user only gets an actionable message.
        console.warn(`[auth] ${action} rate-limited:`, error?.code || error?.message);
        return 'Too many attempts. Please wait a few minutes and try again.';
    }

    if (code === 'email_address_not_authorized' || message.includes('not allowed')) {
        console.warn(`[auth] ${action} blocked domain:`, error?.code || error?.message);
        return 'This email address is not allowed. Please contact your administrator.';
    }

    if (message.includes('invalid login credentials')) {
        return 'Invalid credentials.';
    }

    if (message.includes('email not confirmed')) {
        return 'Please confirm your email before signing in.';
    }

    return error?.message || `${action} failed`;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const syncUser = async (nextSession) => {
            if (!mounted) return;
            if (!nextSession) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const me = await api.getMe();
                if (mounted) setUser(me);
            } catch {
                if (mounted) {
                    setUser(null);
                    await supabase.auth.signOut();
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        supabase.auth.getSession().then(({ data }) => {
            syncUser(data.session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            syncUser(nextSession);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(mapAuthError(error, 'Sign in'));

        if (!data.session) {
            throw new Error('Please confirm your email before signing in.');
        }

        const me = await api.getMe();
        setUser(me);
        return me;
    };

    const forgotPassword = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw new Error(mapAuthError(error, 'Password reset'));
    };

    const resetPassword = async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(mapAuthError(error, 'Password update'));
    };

    const logout = () => {
        supabase.auth.signOut();
        setUser(null);
    };

    const refreshUser = async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
            setUser(null);
            return null;
        }
        const me = await api.getMe();
        setUser(me);
        return me;
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider
            value={{ user, loading, login, logout, forgotPassword, resetPassword, refreshUser, isAdmin }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

import { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Spinner } from './components/ui/Loading';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ForcePasswordChangeDialog from './components/ForcePasswordChangeDialog';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const KanbanBoard = lazy(() => import('./pages/KanbanBoard'));
const MyTasks = lazy(() => import('./pages/MyTasks'));
const ActivityLog = lazy(() => import('./pages/ActivityLog'));
const Users = lazy(() => import('./pages/Users'));
const Profile = lazy(() => import('./pages/Profile'));
const AgentFloatingChat = lazy(() => import('./components/AgentFloatingChat'));

function FullSpinner() {
    return (
        <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
            <Spinner />
        </div>
    );
}

function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading, isAdmin } = useAuth();

    if (loading) return <FullSpinner />;
    if (!user) return <Navigate to="/login" replace />;
    if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

    return children;
}

function AppLayout() {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const location = useLocation();

    return (
        <div className="relative flex min-h-screen transition-theme" style={{ background: 'var(--bg-secondary)' }}>
            <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

            {mobileSidebarOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-label="Close navigation"
                />
            )}

            <div className="flex min-w-0 flex-1 flex-col md:ml-[240px]">
                <Header onMenuClick={() => setMobileSidebarOpen((prev) => !prev)} />
                <main className="flex-1 overflow-auto p-4 sm:p-6">
                    <Suspense fallback={<Spinner className="py-24" />}>
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <Routes location={location}>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/projects" element={<Projects />} />
                                    <Route path="/projects/:id" element={<KanbanBoard />} />
                                    <Route path="/my-tasks" element={<MyTasks />} />
                                    <Route path="/activity" element={<ActivityLog />} />
                                    <Route path="/profile" element={<Profile />} />
                                    <Route
                                        path="/users"
                                        element={
                                            <ProtectedRoute adminOnly>
                                                <Users />
                                            </ProtectedRoute>
                                        }
                                    />
                                </Routes>
                            </motion.div>
                        </AnimatePresence>
                    </Suspense>
                </main>
            </div>
            <Suspense fallback={null}>
                <AgentFloatingChat />
            </Suspense>
            <ForcePasswordChangeDialog />
        </div>
    );
}

export default function App() {
    return (
        <MotionConfig reducedMotion="user">
            <BrowserRouter>
                <ThemeProvider>
                    <AuthProvider>
                        <ToastProvider>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password" element={<ResetPassword />} />
                                <Route
                                    path="/*"
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout />
                                        </ProtectedRoute>
                                    }
                                />
                            </Routes>
                        </ToastProvider>
                    </AuthProvider>
                </ThemeProvider>
            </BrowserRouter>
        </MotionConfig>
    );
}

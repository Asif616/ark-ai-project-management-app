import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../api';
import { subscribeDataRefresh } from '../realtime';
import { FolderKanban, ListTodo, Users, TrendingUp, CalendarClock, CalendarX2, History } from 'lucide-react';
import SpotlightCard from '../components/bits/SpotlightCard';
import CountUp from '../components/bits/CountUp';
import ActivityList from '../components/dashboard/ActivityList';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import { Skeleton, EmptyState } from '../components/ui/Loading';
import { statusMeta, priorityTone } from '../components/ui/statusTones';

const DashboardCharts = lazy(() => import('../components/dashboard/DashboardCharts'));

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
};
const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

function StatCard({ icon: Icon, label, value, accent, suffix = '' }) {
    return (
        <motion.div variants={item}>
            <SpotlightCard className="surface surface-hover h-full p-4 sm:p-5">
                <div
                    className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg sm:h-10 sm:w-10"
                    style={{ background: `${accent}1f`, color: accent }}
                >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <p className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    <CountUp to={value} suffix={suffix} />
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)] sm:text-sm">{label}</p>
            </SpotlightCard>
        </motion.div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="surface p-4 sm:p-5">
                        <Skeleton className="mb-4 h-10 w-10 rounded-lg" />
                        <Skeleton className="h-7 w-20" />
                        <Skeleton className="mt-2 h-4 w-28" />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <div className="surface p-5 lg:col-span-3">
                    <Skeleton className="mb-5 h-4 w-32" />
                    <Skeleton className="h-[260px] w-full" />
                </div>
                <div className="surface p-5 lg:col-span-2">
                    <Skeleton className="mb-5 h-4 w-36" />
                    <Skeleton className="h-[260px] w-full" />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const fetchStats = () => {
        api.getDashboardStats()
            .then((data) => {
                setStats(data);
                setLoadError(false);
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false));
        api.getActivity()
            .then(setActivity)
            .catch(() => {});
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => subscribeDataRefresh(fetchStats), []);

    if (loading) return <DashboardSkeleton />;

    if (!stats) {
        return (
            <div className="surface p-4">
                <Alert tone="danger">
                    {loadError
                        ? 'Unable to load dashboard data right now. Please refresh and try again.'
                        : 'No dashboard data available.'}
                </Alert>
            </div>
        );
    }

    const barData = Object.entries(stats.tasks_by_status).map(([name, value]) => ({ name, tasks: value }));
    const pieData = Object.entries(stats.projects_by_status).map(([name, value]) => ({ name, value }));

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatCard icon={FolderKanban} label="Total Projects" value={stats.total_projects} accent="#10b981" />
                <StatCard icon={ListTodo} label="Total Tasks" value={stats.total_tasks} accent="#34d399" />
                <StatCard icon={Users} label="Team Members" value={stats.total_users} accent="#34d399" />
                <StatCard
                    icon={TrendingUp}
                    label="Completion Rate"
                    value={stats.completion_percentage}
                    suffix="%"
                    accent="#fbbf24"
                />
            </motion.div>

            <motion.div variants={item} className="grid grid-cols-2 items-start gap-3 sm:gap-4 lg:grid-cols-4">
                <StatCard icon={CalendarX2} label="Overdue" value={stats.overdue_tasks} accent="#e11d48" />
                <StatCard icon={CalendarClock} label="Due This Week" value={stats.due_soon_tasks} accent="#0284c7" />
                <div className="surface col-span-2 flex flex-col p-4 sm:p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-[var(--text-primary)]">
                            <History className="h-4 w-4 text-[var(--text-muted)]" /> Recent Activity
                        </h3>
                        <Link
                            to="/activity"
                            className="shrink-0 text-xs font-medium text-primary-500 hover:text-primary-600"
                        >
                            See more &rarr;
                        </Link>
                    </div>
                    <ActivityList items={activity.slice(0, 2)} />
                </div>
            </motion.div>

            <motion.div variants={item}>
                <Suspense fallback={<DashboardSkeleton />}>
                    <DashboardCharts barData={barData} pieData={pieData} />
                </Suspense>
            </motion.div>

            <motion.div variants={item} className="surface p-5">
                <h3 className="mb-4 font-display text-sm font-semibold text-[var(--text-primary)]">Recent Tasks</h3>
                    {stats.recent_tasks.length === 0 ? (
                        <EmptyState
                            icon={ListTodo}
                            title="No tasks yet"
                            hint="Create a project and add some tasks to see them here."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[560px] text-sm">
                                <thead>
                                    <tr className="text-[var(--text-muted)]">
                                        <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider">Task</th>
                                        <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider">Project</th>
                                        <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider">Assignee</th>
                                        <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                        <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider">Priority</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.recent_tasks.map((t) => (
                                        <tr key={t.id} className="border-t border-[var(--border-subtle)]">
                                            <td className="py-3 font-medium text-[var(--text-primary)]">{t.title}</td>
                                            <td className="py-3 text-[var(--text-secondary)]">{t.project_name}</td>
                                            <td className="py-3 text-[var(--text-secondary)]">{t.assignee_name || '—'}</td>
                                            <td className="py-3">
                                                <Badge tone={statusMeta[t.status].tone}>{(statusMeta[t.status] || {}).label || t.status}</Badge>
                                            </td>
                                            <td className="py-3">
                                                <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>


        </motion.div>
    );
}

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { api } from '../api';
import { subscribeDataRefresh } from '../realtime';
import { Skeleton, EmptyState } from '../components/ui/Loading';
import ActivityList from '../components/dashboard/ActivityList';

export default function ActivityLog() {
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivity = () => {
        api.getActivity({ limit: 50 })
            .then(setActivity)
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(fetchActivity, []);
    useEffect(() => subscribeDataRefresh(fetchActivity), []);

    return (
        <div className="space-y-6">
            <div className="surface p-5">
                {loading ? (
                    <div className="space-y-3">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                        ))}
                    </div>
                ) : activity.length === 0 ? (
                    <EmptyState
                        icon={History}
                        title="No activity yet"
                        hint="Project and task updates will show up here."
                    />
                ) : (
                    <ActivityList items={activity} />
                )}
            </div>
        </div>
    );
}

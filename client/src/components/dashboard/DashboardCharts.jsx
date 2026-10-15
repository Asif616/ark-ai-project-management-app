import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

const PIE_COLOR_BY_STATUS = {
    Active: '#38bdf8',
    Completed: '#10b981',
    'On Hold': '#fbbf24',
};

const FALLBACK_PIE_COLORS = ['#38bdf8', '#10b981', '#fbbf24', '#94a3b8'];

const TASK_BAR_COLORS = {
    'To Do': '#94a3b8',
    'In Progress': '#38bdf8',
    Review: '#fbbf24',
    Done: '#10b981',
};

export default function DashboardCharts({ barData, pieData }) {
    const tooltipStyle = {
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        boxShadow: 'var(--shadow-md)',
        color: 'var(--text-primary)',
        fontSize: 13,
        padding: '8px 10px',
    };
    const tooltipTextStyle = { color: 'var(--text-primary)' };

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="surface p-5 lg:col-span-3">
                <h3 className="mb-4 font-display text-sm font-semibold text-[var(--text-primary)]">Tasks by Status</h3>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} barCategoryGap="32%">
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="color-mix(in oklch, var(--border-color) 70%, transparent)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={tooltipStyle}
                            labelStyle={tooltipTextStyle}
                            itemStyle={tooltipTextStyle}
                            cursor={{ fill: 'rgba(16,185,129,0.08)' }}
                        />
                        <Bar dataKey="tasks" radius={[6, 6, 0, 0]} animationDuration={900}>
                            {barData.map((entry) => (
                                <Cell key={`bar-${entry.name}`} fill={TASK_BAR_COLORS[entry.name] || '#10b981'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="surface p-5 lg:col-span-2">
                <h3 className="mb-4 font-display text-sm font-semibold text-[var(--text-primary)]">
                    Projects by Status
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            animationDuration={900}
                        >
                            {pieData.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={
                                        PIE_COLOR_BY_STATUS[pieData[i]?.name] ||
                                        FALLBACK_PIE_COLORS[i % FALLBACK_PIE_COLORS.length]
                                    }
                                />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipTextStyle} itemStyle={tooltipTextStyle} />
                        <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

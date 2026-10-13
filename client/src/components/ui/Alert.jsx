import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

const tones = {
    info: ['alert-info', Info],
    success: ['alert-success', CheckCircle2],
    warning: ['alert-warning', TriangleAlert],
    danger: ['alert-danger', AlertCircle],
};

export default function Alert({ tone = 'info', children }) {
    const [cls, Icon] = tones[tone];
    return (
        <div className={[cls, 'alert'].join(' ')} role={tone === 'danger' ? 'alert' : 'status'}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
                <p>{children}</p>
            </div>
        </div>
    );
}

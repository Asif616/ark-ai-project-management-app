export default function AuroraBackdrop({ className = '' }) {
    return (
        <div className={`aurora ${className}`} aria-hidden="true">
            <div className="aurora__layer aurora__layer--a" />
            <div className="aurora__layer aurora__layer--b" />
            <div className="aurora__grid" />
            <div className="aurora__vignette" />
        </div>
    );
}

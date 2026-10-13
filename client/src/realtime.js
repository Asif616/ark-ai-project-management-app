const DATA_REFRESH_EVENT = 'bam:data-refresh';

export function notifyDataRefresh() {
    window.dispatchEvent(new Event(DATA_REFRESH_EVENT));
}

export function subscribeDataRefresh(handler) {
    window.addEventListener(DATA_REFRESH_EVENT, handler);
    return () => window.removeEventListener(DATA_REFRESH_EVENT, handler);
}

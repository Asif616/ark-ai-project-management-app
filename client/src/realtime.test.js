// realtime.js talks to window; stub a minimal EventTarget so node can run it.
import test from 'node:test';
import assert from 'node:assert/strict';

function installWindowStub() {
    const listeners = new Map();
    globalThis.window = {
        dispatchEvent(event) {
            for (const fn of listeners.get(event.type) ?? []) fn(event);
            return true;
        },
        addEventListener(type, fn) {
            listeners.set(type, [...(listeners.get(type) ?? []), fn]);
        },
        removeEventListener(type, fn) {
            listeners.set(type, (listeners.get(type) ?? []).filter((f) => f !== fn));
        },
    };
}

installWindowStub();
const { notifyDataRefresh, subscribeDataRefresh } = await import('./realtime.js');

test('subscriber fires on notify', () => {
    let calls = 0;
    const unsub = subscribeDataRefresh(() => calls++);
    notifyDataRefresh();
    notifyDataRefresh();
    assert.equal(calls, 2);
    unsub();
});

test('unsubscribe stops notifications', () => {
    let calls = 0;
    const unsub = subscribeDataRefresh(() => calls++);
    unsub();
    notifyDataRefresh();
    assert.equal(calls, 0);
});

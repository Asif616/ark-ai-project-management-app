// Contract test: every status/priority the backend can send has a tone.
import test from 'node:test';
import assert from 'node:assert/strict';

import { priorityTone, statusMeta } from './statusTones.js';

test('all task statuses have label + tone + accent', () => {
    for (const key of ['todo', 'in_progress', 'review', 'done']) {
        assert.ok(statusMeta[key]?.label, `missing label for ${key}`);
        assert.ok(statusMeta[key]?.tone, `missing tone for ${key}`);
        assert.ok(statusMeta[key]?.accent, `missing accent for ${key}`);
    }
});

test('all project statuses are covered', () => {
    for (const key of ['active', 'completed', 'on_hold']) {
        assert.ok(statusMeta[key]?.label, `missing label for ${key}`);
    }
});

test('all priorities map to a tone', () => {
    assert.deepEqual({ ...priorityTone }, { low: 'neutral', medium: 'warning', high: 'danger' });
});

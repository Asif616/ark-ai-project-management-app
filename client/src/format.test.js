// Best practice: pure helpers get table-driven unit tests — no DOM, no mocks.
import test from 'node:test';
import assert from 'node:assert/strict';

import { formatDate, isOverdue, timeAgo } from './format.js';

test('timeAgo: just now / minutes / hours / days', () => {
    const now = Date.now();
    assert.equal(timeAgo(new Date(now - 10_000).toISOString()), 'just now');
    assert.equal(timeAgo(new Date(now - 5 * 60_000).toISOString()), '5m ago');
    assert.equal(timeAgo(new Date(now - 3 * 3_600_000).toISOString()), '3h ago');
    assert.equal(timeAgo(new Date(now - 3 * 86_400_000).toISOString()), '3d ago');
});

test('timeAgo: invalid input returns empty string', () => {
    assert.equal(timeAgo('not-a-date'), '');
});

test('timeAgo: naive server datetimes are treated as UTC', () => {
    // Server stores naive UTC (sqlite strips tz); '2000-01-01 00:00' must parse, not NaN.
    assert.notEqual(timeAgo('2000-01-01 00:00:00'), '');
});

test('isOverdue: past due + open => true', () => {
    assert.equal(isOverdue({ due_date: '2000-01-01', status: 'todo' }), true);
});

test('isOverdue: done tasks are never overdue', () => {
    assert.equal(isOverdue({ due_date: '2000-01-01', status: 'done' }), false);
});

test('isOverdue: future due date => false', () => {
    assert.equal(isOverdue({ due_date: '2999-01-01', status: 'todo' }), false);
});

test('isOverdue: missing due date => false', () => {
    assert.equal(isOverdue({ status: 'todo' }), false);
});

test('formatDate: valid / empty / garbage', () => {
    assert.match(formatDate('2024-03-05'), /Mar/);
    assert.equal(formatDate(''), '');
    assert.equal(formatDate('garbage'), 'garbage');
});

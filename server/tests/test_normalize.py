"""normalize_status / normalize_priority: every synonym maps, garbage raises."""

import pytest

from services.tasks_service import normalize_priority, normalize_status


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("todo", "todo"),
        ("to do", "todo"),
        ("pending", "todo"),
        ("new", "todo"),
        ("in progress", "in_progress"),
        ("started", "in_progress"),
        ("doing", "in_progress"),
        ("in review", "review"),
        ("reviewing", "review"),
        ("completed", "done"),
        ("complete", "done"),
        ("finished", "done"),
        ("closed", "done"),
        ("  Completed  ", "done"),  # case + whitespace insensitive
        ("DONE", "done"),
    ],
)
def test_normalize_status(raw, expected):
    assert normalize_status(raw) == expected


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("low", "low"),
        ("medium", "medium"),
        ("high", "high"),
        ("urgent", "high"),
        ("critical", "high"),
        ("normal", "medium"),
        ("minor", "low"),
        ("trivial", "low"),
    ],
)
def test_normalize_priority(raw, expected):
    assert normalize_priority(raw) == expected


@pytest.mark.parametrize("bad", ["", "bogus", "asap", "done-ish"])
def test_invalid_status_raises(bad):
    with pytest.raises(ValueError, match="Invalid status"):
        normalize_status(bad)


def test_invalid_priority_raises():
    with pytest.raises(ValueError, match="Invalid priority"):
        normalize_priority("asap")

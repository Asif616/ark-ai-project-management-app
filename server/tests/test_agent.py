"""agent_service pure bits + chat flow with the LLM faked; agent_tools _json."""

import asyncio
from types import SimpleNamespace

import pytest

from schemas import ProjectCreate, TaskCreate
from services import agent_service, agent_tools


def _msg(content):
    return SimpleNamespace(content=content)


def test_identity_block():
    block = agent_service._identity_block(
        {"name": "Ann", "email": "a@x.com", "id": 7, "role": "user"}
    )
    assert "Ann" in block and "user_id=7" in block


@pytest.mark.parametrize(
    ("result", "expected"),
    [
        ({"messages": []}, ""),
        ({}, ""),
        ("not-a-dict", ""),
        ({"messages": [_msg("  hi  ")]}, "hi"),
        ({"messages": [_msg([{"type": "text", "text": "a"}, {"type": "other"}])]}, "a"),
        ({"messages": [_msg(42)]}, "42"),
    ],
)
def test_extract_text(result, expected):
    assert agent_service._extract_text(result) == expected


def test_chat_rejects_empty():
    with pytest.raises(ValueError, match="Message cannot be empty"):
        asyncio.run(agent_service.chat_with_agent("   ", "t", {"role": "user"}))


def test_chat_uses_fake_agent(monkeypatch):
    agent_service._agents.clear()

    class FakeAgent:
        async def ainvoke(self, messages, config=None):
            return {"messages": [_msg("pong")]}

    monkeypatch.setattr(agent_service, "_build_agent", lambda role: FakeAgent())
    out = asyncio.run(
        agent_service.chat_with_agent("hi", "t1", {"id": 1, "role": "user", "name": "A", "email": "a"})
    )
    assert out == "pong"
    assert set(agent_service._agents) == {"user"}  # cached per role
    agent_service._agents.clear()


def test_build_agent_needs_key(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="GROQ_API_KEY"):
        agent_service._build_agent("user")


def test_json_blanks():
    assert agent_tools._json(None) == "No results found."
    assert agent_tools._json([]) == "No results found."
    assert agent_tools._json({}) == "No results found."
    assert agent_tools._json("x") == "x"


def test_json_serializes_schemas():
    dumped = agent_tools._json(ProjectCreate(name="P"))
    assert dumped["name"] == "P"
    dumped_list = agent_tools._json([TaskCreate(title="t", project_id=1)])
    assert dumped_list[0]["title"] == "t"


def test_json_serializes_user(db, user):
    dumped = agent_tools._json(user)
    assert dumped["email"] == user.email


def test_my_tasks_needs_actor(db, project, user):
    from schemas import TaskCreate
    from services import tasks_service

    tasks_service.create_task(db, TaskCreate(title="mine", project_id=project.id, assignee_id=user.id))
    agent_tools.set_actor(None)
    assert agent_tools.my_tasks_tool.func() == []
    agent_tools.set_actor({"id": user.id})
    try:
        mine = agent_tools.my_tasks_tool.func()
        assert len(mine) == 1
    finally:
        agent_tools.set_actor(None)


def test_admin_user_tool_split():
    admin_names = {t.name for t in agent_tools.AGENT_TOOLS_ADMIN}
    user_names = {t.name for t in agent_tools.AGENT_TOOLS_USER}
    assert {"delete_task_tool", "create_user_tool", "delete_project_tool"} <= admin_names
    assert {"delete_task_tool", "create_user_tool"} - user_names == {"delete_task_tool", "create_user_tool"}
    assert "list_tasks_tool" in user_names

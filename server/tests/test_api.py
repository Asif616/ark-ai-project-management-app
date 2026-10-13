"""App-level smoke: root route + exception handlers map to 404/400."""

from fastapi.testclient import TestClient

import main


def test_root():
    client = TestClient(main.app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "ARK server is running"}


def test_lookup_error_handler():
    response = main.not_found_handler(None, LookupError("Task not found"))
    assert response.status_code == 404
    import json

    assert json.loads(response.body) == {"detail": "Task not found"}


def test_value_error_handler():
    response = main.bad_request_handler(None, ValueError("Invalid status 'x'"))
    assert response.status_code == 400
    import json

    assert json.loads(response.body) == {"detail": "Invalid status 'x'"}

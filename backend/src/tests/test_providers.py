import asyncio
import json
from contextlib import contextmanager
from typing import Any

import httpx

from src.agents.providers.openai_compatible import OpenAICompatibleProvider
from src.schemas.providers import ProviderMetadata, ProviderType


class FakeResponse:
    def __init__(self, payload: dict[str, Any]) -> None:
        self._payload = payload

    def raise_for_status(self) -> None:
        pass

    def json(self) -> dict[str, Any]:
        return self._payload


class FakeClient:
    def __init__(self, payload: dict[str, Any]) -> None:
        self._payload = payload

    async def __aenter__(self) -> "FakeClient":
        return self

    async def __aexit__(self, *_: Any) -> None:
        pass

    async def get(self, *_: Any, **__: Any) -> FakeResponse:
        return FakeResponse(self._payload)


@contextmanager
def _patch_client(payload: dict[str, Any]):
    original = httpx.AsyncClient
    httpx.AsyncClient = lambda *args, **kwargs: FakeClient(payload)
    try:
        yield
    finally:
        httpx.AsyncClient = original


def _anyapi(payload: dict[str, Any]):
    provider = OpenAICompatibleProvider(
        ProviderMetadata(id=ProviderType.ANYAPI, label="AnyAPI AI", default_base_url="https://api.anyapi.ai/v1")
    )
    with _patch_client(payload):
        return asyncio.run(provider.list_models("test-key"))


def test_list_models_survives_null_top_provider_and_architecture() -> None:
    payload = {
        "object": "list",
        "data": [
            {"id": "openai/gpt-4o", "owned_by": "openai", "top_provider": None, "architecture": None},
            {"id": "anthropic/claude-sonnet-4", "owned_by": "anthropic", "top_provider": None},
            {"id": "google/gemini-3", "owned_by": "google", "context_length": 1000000, "top_provider": {"context_length": 8000}},
        ],
    }
    models = _anyapi(payload)
    ids = [model.id for model in models]
    assert ids == ["anthropic/claude-sonnet-4", "google/gemini-3", "openai/gpt-4o"]
    assert {model.id: model.context_window for model in models}["google/gemini-3"] == 1000000


def test_list_models_ignores_non_dict_subfields() -> None:
    payload = json.loads(
        json.dumps(
            {
                "data": [
                    {"id": "deepseek/deepseek-v4", "top_provider": None, "owned_by": None},
                ]
            }
        )
    )
    models = _anyapi(payload)
    assert [model.id for model in models] == ["deepseek/deepseek-v4"]
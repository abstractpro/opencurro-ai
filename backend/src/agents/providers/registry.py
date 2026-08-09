from src.agents.providers.base import LLMProvider
from src.agents.providers.openai_compatible import OpenAICompatibleProvider
from src.agents.providers.ollama_cloud import OllamaCloudProvider
from src.schemas.providers import ProviderMetadata, ProviderType


_DEFAULT_PROVIDERS: dict[str, ProviderMetadata] = {
    "openrouter": ProviderMetadata(
        id="openrouter",
        label="OpenRouter",
        default_base_url="https://openrouter.ai/api/v1",
    ),
    "groq": ProviderMetadata(
        id="groq",
        label="Groq",
        default_base_url="https://api.groq.com/openai/v1",
    ),
    "nvidia": ProviderMetadata(
        id="nvidia",
        label="NVIDIA NIM",
        default_base_url="https://integrate.api.nvidia.com/v1",
    ),
    "fireworks-ai": ProviderMetadata(
        id="fireworks-ai",
        label="Fireworks AI",
        default_base_url="https://api.fireworks.ai/inference/v1",
    ),
    "ollama-cloud": ProviderMetadata(
        id="ollama-cloud",
        label="Ollama Cloud",
        default_base_url="https://ollama.com/api/v1",
    ),
    "opencode": ProviderMetadata(
        id="opencode",
        label="OpenCode Zen",
        default_base_url="https://opencode.ai/zen/v1",
    ),
    "aihubmix": ProviderMetadata(
        id="aihubmix",
        label="AIHubMix",
        default_base_url="https://api.aihubmix.com/v1",
    ),
    "blueclaw": ProviderMetadata(
        id="blueclaw",
        label="Blue Claw",
        default_base_url="https://openai.blueclaw.network/v1",
    ),
}


class ProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, LLMProvider] = {}
        for pid, meta in self._default_providers().items():
            self._providers[pid] = OpenAICompatibleProvider(meta)

    @staticmethod
    def _default_providers() -> dict[str, ProviderMetadata]:
        return _DEFAULT_PROVIDERS

    def get(self, provider_type: ProviderType) -> LLMProvider:
        provider_type = str(provider_type)
        if provider_type in self._providers:
            return self._providers[provider_type]

        metadata = ProviderMetadata(
            id=provider_type,
            label=provider_type.replace("-", " ").replace("_", " ").title(),
            default_base_url="",
        )
        provider = OpenAICompatibleProvider(metadata)
        self._providers[provider_type] = provider
        return provider

    def list_supported(self) -> list[ProviderMetadata]:
        return [provider.metadata for provider in self._providers.values()]

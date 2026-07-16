from openai import AsyncOpenAI

from app.config import get_settings

settings = get_settings()


def get_openai_client() -> AsyncOpenAI:
    """Azure AI Foundry's OpenAI v1-compatible endpoint (GPT-5 via Responses API,
    text-embedding-3-large via the standard embeddings endpoint)."""
    return AsyncOpenAI(base_url=settings.azure_foundry_endpoint, api_key=settings.azure_foundry_api_key)

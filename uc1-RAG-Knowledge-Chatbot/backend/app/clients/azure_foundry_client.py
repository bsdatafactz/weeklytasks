from azure.ai.inference.aio import ChatCompletionsClient
from azure.core.credentials import AzureKeyCredential
from openai import AsyncAzureOpenAI

from app.config import get_settings

settings = get_settings()


def get_openai_client() -> AsyncAzureOpenAI:
    """OpenAI-compatible Foundry deployments: GPT-5.5 generation, text-embedding-3-* embeddings."""
    return AsyncAzureOpenAI(
        azure_endpoint=settings.azure_foundry_endpoint,
        api_key=settings.azure_foundry_api_key,
        api_version=settings.azure_foundry_api_version,
    )


def get_inference_client() -> ChatCompletionsClient:
    """Azure AI Inference route for non-OpenAI Foundry deployments (DeepSeek V3.2)."""
    return ChatCompletionsClient(
        endpoint=settings.azure_foundry_endpoint,
        credential=AzureKeyCredential(settings.azure_foundry_api_key),
    )

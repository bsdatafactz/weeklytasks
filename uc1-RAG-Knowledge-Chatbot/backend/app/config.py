from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_api_key: str = "dev-local-key"
    cors_origins: list[str] = ["http://localhost:5173"]

    database_url: str = "postgresql+asyncpg://uc1:uc1@localhost:5433/uc1_rag"

    azure_search_endpoint: str = ""
    azure_search_api_key: str = ""
    azure_search_index_name: str = "uc1-rag-index"

    azure_foundry_endpoint: str = ""  # OpenAI v1-compatible base, e.g. https://<resource>.services.ai.azure.com/openai/v1
    azure_foundry_api_key: str = ""

    generation_model_default: str = "gpt-5"

    embedding_model_default: str = "text-embedding-3-large"
    embedding_model_alt: str = "text-embedding-3-small"

    retrieval_top_k: int = 5
    # Azure AI Search semantic reranker scores range ~0-4, not 0-1 -- 2.0 is Microsoft's
    # documented starting point for filtering low-quality matches, confirmed against our
    # own corpus (in-corpus hits scored 2.0-3.4, an out-of-corpus question scored 1.35).
    retrieval_score_threshold: float = 2.0


@lru_cache
def get_settings() -> Settings:
    return Settings()

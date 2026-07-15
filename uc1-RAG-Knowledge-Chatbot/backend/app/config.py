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

    azure_foundry_endpoint: str = ""
    azure_foundry_api_key: str = ""
    azure_foundry_api_version: str = "2024-10-21"

    generation_model_default: str = "deepseek-v3.2"
    generation_model_alt: str = "gpt-5.5"

    embedding_model_default: str = "text-embedding-3-large"
    embedding_model_alt: str = "text-embedding-3-small"

    retrieval_top_k: int = 5
    retrieval_score_threshold: float = 0.55


@lru_cache
def get_settings() -> Settings:
    return Settings()

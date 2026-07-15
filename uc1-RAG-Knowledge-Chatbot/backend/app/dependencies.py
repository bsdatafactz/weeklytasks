from fastapi import Header, HTTPException, status

from app.config import get_settings

settings = get_settings()


async def require_api_key(x_api_key: str = Header(...)) -> None:
    if x_api_key != settings.app_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")

import logging

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from openai import APIError, OpenAI
from pydantic import BaseModel, Field

from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("day1_hello_world")

app = FastAPI(title="DataFactZ Day 1 Hello-World", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=settings.openai_api_key)


def require_api_key(x_api_key: str = Header(...)) -> None:
    if x_api_key != settings.app_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")


class GreetRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100, examples=["Brahmanya"])


class GreetResponse(BaseModel):
    message: str


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post(
    "/api/v1/greet",
    response_model=GreetResponse,
    dependencies=[Depends(require_api_key)],
)
def greet(payload: GreetRequest) -> GreetResponse:
    try:
        completion = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are the welcome assistant for DataFactZ, an AI-first "
                        "consulting company. Greet the person by name in one warm, "
                        "professional sentence."
                    ),
                },
                {"role": "user", "content": f"My name is {payload.name}."},
            ],
            max_tokens=100,
        )
    except APIError:
        logger.exception("OpenAI API call failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upstream LLM provider error",
        )

    content = completion.choices[0].message.content
    if not content:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM returned an empty response",
        )

    return GreetResponse(message=content.strip())

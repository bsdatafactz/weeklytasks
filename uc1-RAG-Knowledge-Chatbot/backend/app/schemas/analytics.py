from pydantic import BaseModel


class Totals(BaseModel):
    conversation_count: int
    question_count: int
    answered_count: int
    refused_count: int
    total_tokens: int


class ModelUsage(BaseModel):
    model: str
    message_count: int
    input_tokens: int
    output_tokens: int
    total_tokens: int


class AnalyticsOut(BaseModel):
    totals: Totals
    usage_by_model: list[ModelUsage]

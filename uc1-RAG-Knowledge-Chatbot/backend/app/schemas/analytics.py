from pydantic import BaseModel


class Totals(BaseModel):
    conversation_count: int
    user_message_count: int
    assistant_message_count: int
    input_tokens: int
    output_tokens: int
    total_tokens: int


class ModelUsage(BaseModel):
    model: str
    message_count: int
    input_tokens: int
    output_tokens: int
    total_tokens: int


class DayCount(BaseModel):
    date: str
    count: int


class AnalyticsOut(BaseModel):
    totals: Totals
    usage_by_model: list[ModelUsage]
    messages_per_day: list[DayCount]

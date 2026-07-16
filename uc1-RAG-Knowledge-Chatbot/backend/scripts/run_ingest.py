"""Manually (re-)run ingestion. Usage (from backend/): uv run python scripts/run_ingest.py"""

import asyncio
import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db import async_session_factory  # noqa: E402
from app.services import ingestion_service  # noqa: E402


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    async with async_session_factory() as db:
        start = time.monotonic()
        result = await ingestion_service.ingest_all(db, triggered_by="manual-cli")
        elapsed = time.monotonic() - start
        print(f"RESULT: {result} in {elapsed:.1f}s", flush=True)


if __name__ == "__main__":
    asyncio.run(main())

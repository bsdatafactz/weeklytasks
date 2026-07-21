import asyncio
import hashlib
import logging
import re
from dataclasses import dataclass
from pathlib import Path

import tiktoken
from azure.search.documents.indexes.models import (
    HnswAlgorithmConfiguration,
    SearchableField,
    SearchField,
    SearchFieldDataType,
    SearchIndex,
    SemanticConfiguration,
    SemanticField,
    SemanticPrioritizedFields,
    SemanticSearch,
    SimpleField,
    VectorSearch,
    VectorSearchProfile,
)
from bs4 import BeautifulSoup
from docx import Document as DocxDocument
from openai import AsyncOpenAI
from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.azure_foundry_client import get_openai_client
from app.clients.azure_search_client import get_search_client, get_search_index_client
from app.config import get_settings
from app.repositories import document_repo, indexing_run_repo
from app.services.generation_service import embed_text

logger = logging.getLogger(__name__)
settings = get_settings()

RESOURCES_DIR = Path(__file__).resolve().parents[2] / "resources"

CHUNK_MAX_TOKENS = 700
CHUNK_OVERLAP_RATIO = 0.12

_encoding = tiktoken.get_encoding("cl100k_base")

@dataclass
class LoadedDocument:
    format: str
    text: str  # normalized text; heading lines prefixed with '#' * level


@dataclass
class Chunk:
    chunk_ref: str
    content: str


_HTML_HEAD_RE = re.compile(rb"^\s*(<!doctype\s+html|<html[\s>])", re.IGNORECASE)


def sniff_format(path: Path) -> str:
    """Sniffs actual content type from the file's bytes rather than trusting the
    extension -- two corpus files (progressive-discipline-policy, handbook-sample.doc)
    are deliberately mislabeled to test exactly this. Previously used python-magic, but
    that needs the system libmagic1 library, which isn't available (and isn't reliably
    installable) in Azure App Service's Python code-deployment runtime -- replaced with
    a small dependency-free check covering exactly the formats this corpus actually has."""
    ext = path.suffix.lower().lstrip(".")
    with path.open("rb") as f:
        head = f.read(4096)

    if head.startswith(b"%PDF"):
        return "pdf"
    if head.startswith(b"PK\x03\x04"):
        return "docx"
    if _HTML_HEAD_RE.match(head):
        return "html"
    # No binary signature matched -- it's text of some kind. There's no content-level
    # way to tell markdown from plain text (both are just prose), so the extension is
    # the only signal for that specific distinction.
    if ext in ("md", "markdown"):
        return "markdown"
    return ext or "unknown"


def _load_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        pages.append(f"# Page {i}\n{text.strip()}")
    return "\n\n".join(pages)


def _load_docx(path: Path) -> str:
    doc = DocxDocument(str(path))
    lines = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        style = (para.style.name or "").lower()
        match = re.match(r"heading (\d)", style)
        if match:
            level = min(int(match.group(1)), 6)
            lines.append(f"{'#' * level} {text}")
        else:
            lines.append(text)
    return "\n\n".join(lines)


def _load_html(path: Path) -> str:
    soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="ignore"), "html.parser")
    lines = []
    for el in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li"]):
        text = el.get_text(strip=True)
        if not text:
            continue
        if el.name.startswith("h"):
            level = int(el.name[1])
            lines.append(f"{'#' * level} {text}")
        else:
            lines.append(text)
    return "\n\n".join(lines)


def _load_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


_LOADERS = {
    "pdf": _load_pdf,
    "docx": _load_docx,
    "html": _load_html,
    "text": _load_text,
    "markdown": _load_text,
}


def load_document(path: Path) -> LoadedDocument:
    fmt = sniff_format(path)
    loader = _LOADERS.get(fmt)
    if loader is None:
        raise ValueError(f"Unsupported format '{fmt}' for {path.name}")
    return LoadedDocument(format=fmt, text=loader(path))


_HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")


def _split_sections(text: str) -> list[tuple[str, str]]:
    """Splits normalized text into (heading, body) sections. Text before the first
    heading (or all of it, if there are no headings) becomes one section titled 'Document'."""
    sections: list[tuple[str, str]] = []
    current_heading = "Document"
    current_lines: list[str] = []

    for line in text.splitlines():
        match = _HEADING_RE.match(line)
        if match:
            if current_lines:
                sections.append((current_heading, "\n".join(current_lines).strip()))
            current_heading = match.group(2).strip()
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        sections.append((current_heading, "\n".join(current_lines).strip()))
    return [(h, b) for h, b in sections if b]


def _split_by_tokens(text: str, max_tokens: int, overlap_ratio: float) -> list[str]:
    tokens = _encoding.encode(text)
    if len(tokens) <= max_tokens:
        return [text]
    step = max(1, int(max_tokens * (1 - overlap_ratio)))
    pieces = []
    for start in range(0, len(tokens), step):
        piece_tokens = tokens[start : start + max_tokens]
        pieces.append(_encoding.decode(piece_tokens))
        if start + max_tokens >= len(tokens):
            break
    return pieces


def chunk_document(loaded: LoadedDocument) -> list[Chunk]:
    chunks: list[Chunk] = []
    sections = _split_sections(loaded.text)
    for heading, body in sections:
        pieces = _split_by_tokens(body, CHUNK_MAX_TOKENS, CHUNK_OVERLAP_RATIO)
        for i, piece in enumerate(pieces, start=1):
            chunk_ref = heading if len(pieces) == 1 else f"{heading} (part {i}/{len(pieces)})"
            chunks.append(Chunk(chunk_ref=chunk_ref, content=piece))
    return chunks


def _checksum(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


SEMANTIC_CONFIG_NAME = "uc1-semantic-config"


async def ensure_index_exists() -> None:
    async with get_search_index_client() as index_client:
        existing = [name async for name in index_client.list_index_names()]
        if settings.azure_search_index_name in existing:
            return

        index = SearchIndex(
            name=settings.azure_search_index_name,
            fields=[
                SimpleField(name="id", type=SearchFieldDataType.String, key=True),
                SimpleField(name="document_id", type=SearchFieldDataType.String, filterable=True),
                SearchableField(name="filename", type=SearchFieldDataType.String, filterable=True),
                SearchableField(name="chunk_ref", type=SearchFieldDataType.String),
                SearchableField(name="content", type=SearchFieldDataType.String),
                SearchField(
                    name="content_vector",
                    type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                    searchable=True,
                    vector_search_dimensions=3072,
                    vector_search_profile_name="uc1-vector-profile",
                ),
            ],
            vector_search=VectorSearch(
                algorithms=[HnswAlgorithmConfiguration(name="uc1-hnsw")],
                profiles=[
                    VectorSearchProfile(name="uc1-vector-profile", algorithm_configuration_name="uc1-hnsw")
                ],
            ),
            semantic_search=SemanticSearch(
                configurations=[
                    SemanticConfiguration(
                        name=SEMANTIC_CONFIG_NAME,
                        prioritized_fields=SemanticPrioritizedFields(
                            title_field=SemanticField(field_name="chunk_ref"),
                            content_fields=[SemanticField(field_name="content")],
                        ),
                    )
                ]
            ),
        )
        await index_client.create_index(index)


EMBED_CONCURRENCY = 20


async def ingest_all(db: AsyncSession, triggered_by: str = "admin") -> dict:
    await ensure_index_exists()
    run = await indexing_run_repo.start_run(db, triggered_by=triggered_by)

    total_docs = 0
    total_chunks = 0
    semaphore = asyncio.Semaphore(EMBED_CONCURRENCY)

    async def embed_bounded(embed_client: AsyncOpenAI, text: str) -> list[float]:
        async with semaphore:
            return await embed_text(text, client=embed_client)

    async with get_search_client() as search_client, get_openai_client() as embed_client:
        for path in sorted(RESOURCES_DIR.iterdir()):
            if not path.is_file():
                continue

            checksum = _checksum(path)
            document = await document_repo.upsert_document(
                db, filename=path.name, format=sniff_format(path), source_path=str(path), checksum=checksum
            )

            loaded = load_document(path)
            chunks = chunk_document(loaded)

            vectors = await asyncio.gather(*(embed_bounded(embed_client, chunk.content) for chunk in chunks))
            search_docs = [
                {
                    "id": f"{document.id}-{i}",
                    "document_id": str(document.id),
                    "filename": document.filename,
                    "chunk_ref": chunk.chunk_ref,
                    "content": chunk.content,
                    "content_vector": vector,
                }
                for i, (chunk, vector) in enumerate(zip(chunks, vectors, strict=True))
            ]

            if search_docs:
                await search_client.upload_documents(search_docs)

            await document_repo.mark_indexed(db, document.id, len(chunks))
            await db.commit()  # durable per-document: a later failure can't orphan this document's
            # Search entries against a rolled-back Postgres row (see incident in commit history)
            total_docs += 1
            total_chunks += len(chunks)
            logger.info(
                "ingested %s: %d chunks (%d docs / %d chunks so far)", path.name, len(chunks), total_docs, total_chunks
            )

    await indexing_run_repo.finish_run(
        db, run.id, doc_count=total_docs, chunk_count=total_chunks, status="completed"
    )
    await db.commit()
    return {"doc_count": total_docs, "chunk_count": total_chunks}

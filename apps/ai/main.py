from enum import Enum
from hashlib import sha256
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

app = FastAPI(title="SmartFashion AI Engine", version="1.0.0")


class SearchMode(str, Enum):
    text = "text"
    image = "image"
    voice = "voice"


class TextSearch(BaseModel):
    query: str = Field(min_length=2, max_length=500)
    limit: int = Field(default=12, ge=1, le=50)


class TryOnRequest(BaseModel):
    session_id: str
    user_image_url: str
    garment_image_url: str
    category: str


def deterministic_embedding(payload: bytes, dimensions: int = 512) -> list[float]:
    """Development adapter. Replace with OpenCLIP in the GPU deployment."""
    digest = sha256(payload).digest()
    return [((digest[i % len(digest)] / 255.0) * 2 - 1) for i in range(dimensions)]


@app.get("/health")
def health():
    return {"status": "ok", "model": "adapter-development"}


@app.post("/v1/embeddings/text")
def embed_text(request: TextSearch):
    return {"mode": SearchMode.text, "dimensions": 512, "embedding": deterministic_embedding(request.query.encode())}


@app.post("/v1/embeddings/image")
async def embed_image(image: Annotated[UploadFile, File()]):
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(415, "Chỉ hỗ trợ JPEG, PNG hoặc WebP")
    data = await image.read(8 * 1024 * 1024 + 1)
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(413, "Ảnh vượt quá 8 MB")
    return {"mode": SearchMode.image, "dimensions": 512, "embedding": deterministic_embedding(data)}


@app.post("/v1/tryon/jobs", status_code=202)
def create_tryon_job(request: TryOnRequest):
    # Production adapter publishes this payload to Redis for IDM-VTON/FASHN workers.
    return {"job_id": request.session_id, "status": "queued", "estimated_seconds": 3.5}

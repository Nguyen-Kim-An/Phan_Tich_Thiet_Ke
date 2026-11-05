# MaisonAI / SmartFashion

### Image search with GPT-4o mini RAG

The web upload route forwards images to the NestJS API. The API calls `gpt-4o-mini` through ShopAIKey to extract garment characteristics, retrieves up to 30 relevant product records with BM25, and reranks them using their metadata and a numbered contact sheet of actual product images. Returned IDs are validated against the retrieved records; fabricated IDs and low-relevance matches are discarded.

Set `SHOPAIKEY_API_KEY`, `SHOPAIKEY_BASE_URL=https://api.shopaikey.com/v1`, and `SHOPAIKEY_MODEL=gpt-4o-mini` in `apps/api/.env`, then restart the API. Keys are server-only. API errors are reported rather than converted into mock search results.

`IMAGE_SEARCH_SOURCE=catalog` uses the 334 products currently displayed by the storefront. Set `IMAGE_SEARCH_SOURCE=postgres` with `DATABASE_URL` to retrieve active PostgreSQL records instead; database failures do not silently switch data sources. In Docker, set `API_INTERNAL_URL` on the web service to the backend's internal URL (e.g. `http://api:4000/api/v1`).

Images are resized in memory and sent to ShopAIKey for analysis. The backend retains only the result for two minutes to avoid repeated paid calls; the browser tab keeps the analysis and grounded product snapshots for 30 minutes. No uploaded image is written to disk by this flow. Similarity scores are model relevance estimates, not calibrated probabilities.

AI-enhanced single-store fashion commerce platform implemented from `HTTT.pdf`.

## Architecture

- `apps/web`: Next.js App Router, Tailwind CSS, Redux Toolkit
- `apps/api`: NestJS modular monolith (identity, catalog, inventory, orders, promotions, analytics)
- `apps/ai`: FastAPI boundary for semantic/image search and virtual try-on jobs
- `infra/postgres`: PostgreSQL 16 + pgvector schema, constraints, indexes and seed data
- Redis: sessions/cache and VTON job queue boundary

## Run locally

1. Copy `.env.example` to `.env` and replace the development secrets.
2. Run `docker compose up --build`.
3. Open `http://localhost:3000`; API docs are available at `http://localhost:4000/docs`.

### Chạy riêng giao diện, không cần Docker

```powershell
npm install
npm run dev -w @smartfashion/web
```

Mở `http://localhost:3000`. Các luồng giao diện và catalog demo chạy độc lập; API, PostgreSQL, Redis và AI service chỉ cần khi kiểm thử tích hợp đầy đủ.

### Thu thập lại ảnh sản phẩm thật

```powershell
npm run crawl:assets
```

Crawler đọc các collection công khai của Everlane, tải hai ảnh cho mỗi sản phẩm vào `apps/web/public/fashion` và tạo `apps/web/src/data/crawled-catalog.json`. Nguồn ảnh được giữ trong metadata; giá VND và tồn kho là dữ liệu mô phỏng cho bài tập học thuật.

### Kiểm tra production frontend

```powershell
npm run build -w @smartfashion/web
npm run start -w @smartfashion/web
```

## Relationship invariants

The SQL migration is the source of truth. Orders reference users; order items reference both orders and exact product variants; variants reference products; products reference hierarchical categories. Images may target a whole product or one of its variants. Embeddings are one-to-one with products. Outfit items form the product/outfit many-to-many join. Inventory is mutated transactionally through `adjust_variant_stock`, which locks the SKU row and rejects negative stock.

## Decart realtime try-on

1. Create an API key at https://platform.decart.ai/api-keys.
2. Copy `apps/api/.env.example` to `apps/api/.env` and set `DECART_API_KEY` there. This file is ignored by Git. Never use `NEXT_PUBLIC_DECART_API_KEY`.
3. Run `npm run dev` from the repository root and open http://localhost:3000/try-on.
4. The backend creates real 10-minute client tokens scoped to `lucy-vton-3.5` and the browser origin. The SDK connects the camera through LiveKit and uploads garment bytes with `setImage`. Local catalog images load directly from the web app; external images use the backend allowlist proxy.
5. Restart the backend after changing `.env`. `configured: true` means the key is present, not that it was accepted. Successful token creation confirms authentication; a remote video stream confirms realtime operation.

The photo-only try-on endpoint is not implemented and returns HTTP 501. It does not return the input image as an AI result. Camera access requires localhost or HTTPS. For another web origin, update `DECART_ALLOWED_ORIGINS` and `WEB_ORIGIN`. External image hosts must be explicitly listed in `DECART_IMAGE_HOSTS`.

Public documentation: https://docs.platform.decart.ai/getting-started/client-tokens and https://docs.platform.decart.ai/sdks/javascript-realtime. The Anywear widget's private endpoints and a spoofed `site` field are not used for authentication.

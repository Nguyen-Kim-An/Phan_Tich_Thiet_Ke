# SmartFashion

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

For frontend/API development without containers, run `npm install` and `npm run dev` while PostgreSQL, Redis, and the AI service are available.

## Relationship invariants

The SQL migration is the source of truth. Orders reference users; order items reference both orders and exact product variants; variants reference products; products reference hierarchical categories. Images may target a whole product or one of its variants. Embeddings are one-to-one with products. Outfit items form the product/outfit many-to-many join. Inventory is mutated transactionally through `adjust_variant_stock`, which locks the SKU row and rejects negative stock.

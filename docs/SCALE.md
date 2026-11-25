# Clinical OS — Scale & load-balance readiness (200k+ users)

**Audience:** Ops + backend engineers  
**Status:** Foundation (architecture + harness). Not a production soak test yet.

## Capacity target

| Metric | Planning assumption |
|---|---|
| Registered users | 200,000+ (mixed roles; ~majority patients, doctors as heavy writers) |
| Concurrent sessions (peak) | 2–5% of registered ≈ 4,000–10,000 |
| Peak RPS (API) | Medicine search + queue polls dominate; design for **1,000–3,000 RPS** behind LB |
| Medicine catalog | Up to ~50k DGDA rows in PostgreSQL with ranking indexes |
| Data store | **PostgreSQL 16** primary; Redis for cache/jobs (stubbed in Compose) |

## Topology

```
Clients (admin / doctor / assistant / patient / pharmacy)
        │
        ▼
   Nginx (least_conn)  ← docker-compose.scale.yml
        │
   ┌────┴────┐
   api1     api2     …N NestJS replicas (stateless JWT)
        │
        ▼
   PostgreSQL (+ optional PgBouncer)
        │
   Redis (sessions/jobs/cache — Phase 1+)
```

### Run single API

```bash
docker compose up --build -d
# API via :3001 or Nginx :8080
```

### Run 2 API replicas + LB

```bash
docker compose -f docker-compose.yml -f docker-compose.scale.yml up --build -d
# Traffic: http://localhost:8080
```

## PostgreSQL readiness

- Schema/migrations: `apps/api/prisma/migrations`
- Extensions: `pg_trgm`, `uuid-ossp` (`infra/postgres/init.sql`)
- Medicine search order: `boost_score DESC, search_rank ASC, brand ASC`
- Indexes: `(boost_score, search_rank)`, brand/generic btree + trigram GIN
- Connection pooling: use **PgBouncer** in transaction mode before 200k; keep Nest `connection_limit` modest per replica
- Vertical scale first (CPU/RAM/IOPS); then read replicas for search-heavy traffic if needed

## Horizontal API rules

1. **Stateless** — JWT only; no in-memory session affinity required  
2. Health: `GET /health` (liveness), `GET /ready` (DB ping) for LB  
3. Rate limit at Nginx (`nginx.scale.conf`) — tune per region  
4. Idempotent writes where possible; audit log for ranking/user changes  
5. Do not store PHI in Redis without encryption + TTL policy  

## Load-test harness

See [`loadtest/`](../loadtest/):

```bash
# API must be running
k6 run loadtest/k6-smoke.js
k6 run loadtest/k6-search-burst.js
```

What to watch:

| Signal | Healthy baseline |
|---|---|
| `/health` p95 | < 20 ms |
| `/medicines/search` p95 | < 100 ms (warm cache/index) |
| Error rate | < 0.1% |
| Postgres CPU | < 70% sustained |
| Connections | Below `max_connections` after pooling |

## Path to 200k (checklist)

- [ ] PgBouncer in front of Postgres  
- [ ] Redis cache for top medicine queries + short TTL  
- [ ] CDN / static hosting for panels  
- [ ] Observability: metrics, traces, slow-query log  
- [ ] Nightly full DGDA import job + ranking preserve  
- [ ] Multi-AZ Postgres + automated backups (RPO ≤ 1h)  
- [ ] Regional failover runbook (Phase 3 in DEVELOPMENT_PLAN)

## Related

- [`DEVELOPER.md`](./DEVELOPER.md) — modules & DB location  
- [`DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) §7 architecture, Phase 3 scale  

# Clinical OS — Scale ও load-balance readiness (২০০k+ users)

**দর্শক:** Ops + backend engineers  
**স্ট্যাটাস:** Foundation (architecture + harness)। এখনো production soak test নয়।

## Capacity target

| Metric | Planning assumption |
|---|---|
| Registered users | 200,000+ (mixed roles; বেশিরভাগ patient, doctor heavy writer) |
| Concurrent sessions (peak) | registered-এর ২–৫% ≈ 4,000–10,000 |
| Peak RPS (API) | Medicine search + queue poll বেশি; LB-এর পিছনে **1,000–3,000 RPS** ধরে ডিজাইন |
| Medicine catalog | PostgreSQL-এ ~50k DGDA row + ranking index |
| Data store | **PostgreSQL** primary (ডিফল্ট native local); Redis optional (cache/jobs পরে) |

দৈনন্দিন development-এ **Docker লাগে না**। নিচের Compose ফাইল শুধু **optional** scale lab।

## Topology

```
Clients (admin / doctor / assistant / patient / pharmacy)
        │
        ▼
   Nginx (least_conn)  ← optional docker-compose.scale.yml
        │
   ┌────┴────┐
   api1     api2     …N NestJS replicas (stateless JWT)
        │
        ▼
   PostgreSQL (+ optional PgBouncer)
        │
   Redis (sessions/jobs/cache — Phase 1+; optional)
```

### একটা API চালান (ডিফল্ট — Docker নেই)

```bash
# native Postgres + LOCAL_SETUP.md
cd apps/api && npm run start:dev
# API :3001
```

### Optional: ২টা API replica + LB (Compose lab)

```bash
docker compose -f docker-compose.yml -f docker-compose.scale.yml up --build -d
# Traffic: http://localhost:8080
```

## PostgreSQL readiness

- Schema/migrations: `apps/api/prisma/migrations`
- Extensions: `pg_trgm`, `uuid-ossp` (`infra/postgres/init.sql`)
- Medicine search order: `boost_score DESC, search_rank ASC, brand ASC`
- Indexes: `(boost_score, search_rank)`, brand/generic btree + trigram GIN
- Connection pooling: 200k-এর আগে **PgBouncer** transaction mode; replica প্রতি Nest `connection_limit` modest রাখুন
- আগে vertical scale (CPU/RAM/IOPS); search-heavy হলে read replica বিবেচনা

## Horizontal API rules

1. **Stateless** — শুধু JWT; in-memory session affinity লাগে না  
2. Health: `GET /health` (liveness), `GET /ready` (DB ping) LB-এর জন্য  
3. Rate limit Nginx-এ (`nginx.scale.conf`) — region অনুযায়ী টিউন  
4. Idempotent write যতটা সম্ভব; ranking/user change-এ audit log  
5. Redis-এ PHI store করবেন না — encryption + TTL policy ছাড়া  

## Load-test harness

[`loadtest/`](../../loadtest/) দেখুন:

```bash
# API চালু থাকতে হবে
k6 run loadtest/k6-smoke.js
k6 run loadtest/k6-search-burst.js
```

যা monitor করবেন:

| Signal | Healthy baseline |
|---|---|
| `/health` p95 | < 20 ms |
| `/medicines/search` p95 | < 100 ms (warm cache/index) |
| Error rate | < 0.1% |
| Postgres CPU | < 70% sustained |
| Connections | pooling-এর পর `max_connections`-এর নিচে |

## ২০০k-এ যাওয়ার checklist

- [ ] Postgres-এর সামনে PgBouncer  
- [ ] Top medicine query-র Redis cache + short TTL  
- [ ] Panel-এর CDN / static hosting  
- [ ] Observability: metrics, traces, slow-query log  
- [ ] Nightly full DGDA import job + ranking preserve (**TODO(dgda-auto-import):** automated DGDA → Postgres `medicines` sync, offline pack refresh; Super Admin ranking অক্ষুণ্ণ)  
- [ ] Multi-AZ Postgres + automated backup (RPO ≤ 1h)  
- [ ] Regional failover runbook (DEVELOPMENT_PLAN Phase 3)  

## Related

- [`DEVELOPER.md`](./DEVELOPER.md) — module ও DB location  
- [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md) §7 architecture, Phase 3 scale  
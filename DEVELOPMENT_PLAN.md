# Unified Clinical Practice Platform — Full Development Plan

**Product working name:** Clinical OS (BD)  
**Tagline:** One Doctor. One Patient Record. Every Chamber.  
**Source:** E-Rx/BD-STRAT/2026/01 (18 Nov 2026)  
**Document type:** Software Development Plan (SDP)  
**Status:** Draft v1.0  
**Audience:** Founders, engineering, product, compliance  

---

## 1. Executive Intent

Build a **Unified Clinical Practice Platform** for Bangladesh—not another prescription printer. Existing tools (19+ competitors) mostly digitize paper pads. Doctors want a continuous medical history platform (80.9% interest); only 4.8% use digital records exclusively; 51.4% still rely on paper.

**We win by:** keyboard-fast prescribing, offline-first reliability, DGHS-normalized drugs, real CDSS, multi-chamber EHR, RBAC privacy, no-install patient access, and FHIR/data portability.

---

## 2. Problem → Solution Map

| Market flaw | Product response |
|---|---|
| Slow manual typing / mouse-heavy UI | Single-screen keyboard-first Rx workbench; 1-click re-Rx; specialty templates |
| Dirty drug DB (duplicates, withdrawn brands) | DGHS-certified normalized formulary (~39,196 products) |
| No clinical context (age/weight/pregnancy/renal) | Context-aware prescribing + CDSS |
| Weak / fatiguing DDI alerts | Evidence-based, severity-ranked, BM&DC-compliant CDSS |
| No Rx version control | Immutable Rx versions + audit trail |
| Cloud dies on load-shedding; offline silos | Offline-first local DB + background sync + local print |
| Multi-chamber chaos | One doctor account → many chambers (pads, fees, serials, staff) |
| Receptionist sees full clinical chart | Granular RBAC; assistant portal = serials/vitals/fees only |
| Fragmented patient files per chamber | Single master patient profile across chambers |
| Lab/pharmacy workflow dead-ends | Digital report attach + pharmacy verify (QR) |
| Fake “mobile apps” (zoomed web) | Real responsive + optional native later; phone-optimized flows |
| Patients forced to install apps | SMS / WhatsApp / QR — no install |
| No follow-up | Follow-up dates, adherence nudges, chronic care timelines |
| Vendor lock-in | One-click export (FHIR + PDF backup) |
| No DGHS FHIR / BM&DC telemed compliance | Design to Core FHIR; doctor-controlled AI; no illegal AI prescribing |

---

## 3. Product Vision & Non-Goals

### Vision
A clinical operating system for Bangladeshi private practice: prescribe in <60 seconds, keep lifelong patient context, work without internet, protect privacy, and plug into national health infrastructure when ready.

### Non-goals (Phase 0–1)
- Full hospital HIS/LIS/RIS replacement
- Inpatient ward management
- Insurance claims adjudication (later)
- Consumer wellness / fitness app
- Autonomous AI prescribing (forbidden under BM&DC)

---

## 4. Target Users & Personas

1. **Specialist doctor (multi-chamber)** — primary buyer; speed + history + chambers  
2. **GP / chamber doctor** — templates, Bengali instructions, offline  
3. **Receptionist / assistant** — serial, fee, vitals; no clinical chart  
4. **Patient (any age/literacy)** — receive Rx via SMS/WhatsApp/QR  
5. **Pharmacist** — verify authenticity / latest version  
6. **Lab partner (later)** — push digital reports into chart  

**ICP (Ideal Customer Profile):** BM&DC-registered doctors in urban/semi-urban chambers seeing ≥15 patients/day, practicing at ≥2 locations, currently on paper or switching from a printer-only tool.

---

## 5. Success Metrics (North Stars)

| Metric | MVP target | 12-month target |
|---|---|---|
| Time to complete Rx (median) | < 60s | < 45s |
| Offline session success rate | ≥ 99% chamber sessions | ≥ 99.5% |
| Weekly active prescribing doctors | 50 (pilot) | 2,000+ |
| Rx issued / week | 5,000 | 150,000+ |
| % Rx with patient history reuse | ≥ 40% | ≥ 70% |
| Assistant RBAC adoption | 80% of multi-staff clinics | 95% |
| Patient open rate (SMS/WA/QR) | ≥ 60% | ≥ 75% |
| NPS (doctors) | ≥ 40 | ≥ 55 |
| Data export requests fulfilled | 100% | 100% |

---

## 6. Scope — Capability Pillars

### P1. High-Speed Prescription Workbench
- Single-screen editor (no tab hopping)
- Keyboard navigation, fuzzy drug search, favorite sets
- 1-click re-prescribe from last / chronic meds
- Specialty templates (medicine, peds, gynae, ortho, etc.)
- Bangla + English auto-instructions (dosage, timing, advice)
- Print + digital share in one action
- Rx versioning (amend → new version; mark superseded)

### P2. Offline-First Architecture
- Local encrypted store (IndexedDB / SQLite / OPFS)
- Full prescribe / save / local print offline
- Conflict-aware background sync when online
- Sync status indicator; queue for pending ops
- Multi-device later: phone + laptop same doctor

### P3. Unified Longitudinal EHR
- One master patient ID per doctor network (and later cross-doctor with consent)
- Timeline: visits, Rx, vitals, allergies, chronic conditions, labs
- Chronic disease panels (DM, HTN, asthma, etc.)
- Search patients by phone / name / ID

### P4. DGHS Drug Knowledge Base
- Ingest & normalize DGHS pharmaceutical list
- Generic ↔ brand ↔ formulation ↔ manufacturer
- Flag withdrawn / unavailable products
- Local cache for offline search
- Admin curation workflow for updates

### P5. Clinical Decision Support (CDSS)
- DDI checks (severity-ranked)
- Allergy / duplicate ingredient alerts
- Age/weight-based pediatric dosing helpers
- Pregnancy / lactation / renal / hepatic caution flags
- Always doctor-overridable; logged overrides
- BM&DC-aligned: assistive, never autonomous prescribe

### P6. Multi-Chamber + RBAC
- Chambers: address, pad header, fee schedule, hours
- Roles: Doctor (owner), Assistant, Receptionist (extensible)
- Assistant portal: queue/serial, vitals, payments — **no full chart**
- Audit log of access and Rx changes

### P7. No-Install Patient + Ecosystem
- Share via SMS, WhatsApp, QR deep link
- Patient view: Rx, instructions Bangla, follow-up date
- Pharmacy verification endpoint (latest version check)
- Lab report upload / attach (Phase 2)

### P8. Standards & Portability
- DGHS Core FHIR-aligned resources (Patient, Encounter, MedicationRequest, Observation, AllergyIntolerance)
- One-click export: FHIR Bundle + PDF archive
- Prepared for national health ID / government systems
- Transparent data ownership policy

---

## 7. Recommended Technical Architecture

### 7.1 High-level

```
┌─────────────────────────────────────────────────────────┐
│  Clients                                                 │
│  Doctor Web App (PWA) │ Assistant Portal │ Patient View │
└───────────────┬──────────────────┬──────────────────────┘
                │                  │
        Offline-first local DB     │
                │                  │
                ▼                  ▼
┌────────────────────┐    ┌──────────────────────────────┐
│ Sync / API Gateway │───▶│ Auth (OTP + BM&DC verify)    │
└─────────┬──────────┘    │ RBAC │ Audit │ Rate limits   │
          │               └──────────────────────────────┘
          ▼
┌────────────────────┐    ┌──────────────────────────────┐
│ Domain Services    │    │ Data                           │
│ Rx │ EHR │ Chamber │───▶│ Postgres (primary)             │
│ CDSS │ Drug KB     │    │ Object storage (PDFs/labs)     │
│ Notify │ FHIR I/O  │    │ Search (Meilisearch/OpenSearch)│
└────────────────────┘    │ Redis (jobs/cache)             │
                          └──────────────────────────────┘
```

### 7.2 Suggested stack (pragmatic for BD market)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js / React PWA + TypeScript | Fast UI, offline service worker, one codebase |
| Local DB | Dexie (IndexedDB) or SQLite WASM | Offline-first |
| Backend | NestJS or FastAPI | Clear modules, typed APIs |
| Primary DB | PostgreSQL | Relational clinical data + JSONB |
| Jobs | Redis + BullMQ / Celery | SMS, sync, exports |
| Auth | Phone OTP + optional email; BM&DC license verify | Doctor trust |
| Print | Browser print CSS + PDF generation | Chamber printers |
| Notify | SMS gateway (local) + WhatsApp Business API | Patient reach |
| Hosting | BD-friendly cloud or regional (AWS ap-south / DO / local VPS) | Latency + cost |
| Observability | Sentry + structured logs + uptime | Reliability |

### 7.3 Offline sync principles
1. **Optimistic local writes** with client-generated UUIDs  
2. **Vector clocks / updated_at + device_id** for conflict detection  
3. **Server authoritative** for Rx version numbers  
4. **Never lose offline Rx** — queue until ack  
5. **Encrypted at rest** on device for PHI  

### 7.4 Security & privacy baseline
- TLS everywhere; encrypt PHI at rest  
- RBAC on every clinical endpoint  
- Field-level restrictions for assistants  
- Audit trail (who viewed/edited what)  
- Minimal patient PII in SMS links (signed short tokens)  
- Backup & disaster recovery RPO ≤ 1h, RTO ≤ 4h (cloud tier)  
- Align with Bangladesh Digital Security Act practices + health data ethics  

---

## 8. Domain Model (Core Entities)

- **User** (doctor, staff) — roles, BM&DC license, chambers  
- **Chamber** — branding/pad, fees, location  
- **Patient** — demographics, phones, master ID  
- **Encounter / Visit** — chamber, serial, vitals, chief complaint  
- **Prescription** — versions, status (draft/signed/superseded), meds lines  
- **MedicationLine** — drug ref, dose, route, frequency, duration, Bangla instruction  
- **DrugProduct / Generic** — DGHS-normalized KB  
- **Allergy, Condition, Observation** — EHR  
- **AlertEvent** — CDSS fired / overridden  
- **ShareLink** — patient/pharmacy access tokens  
- **AuditLog** — immutable events  
- **SyncOutbox** — offline ops  

FHIR mapping targets: `Patient`, `Practitioner`, `Organization` (chamber), `Encounter`, `MedicationRequest`, `Medication`, `AllergyIntolerance`, `Condition`, `Observation`, `Provenance`.

---

## 9. Phased Roadmap

### Phase 0 — Foundations (Weeks 1–3)
- [x] Repo layout + developer handbook + doc sync
- [x] Base DB schema + migrations (PostgreSQL + Prisma)
- [x] Auth shell (JWT + demo OTP); BM&DC field on User
- [x] Multi-role RBAC + admin / assistant / patient / pharmacy panels
- [x] Drug KB in Postgres + Super Admin search ranking
- [x] Docker Compose + Nginx scale profile + k6 harness
- [ ] CI/CD, stage/prod environments
- [x] Design system start (Bangla typography, print layouts kit)
- [ ] Legal: ToS, privacy, data ownership draft
- [ ] Competitor UX teardown → Rx editor wireframes (prototype exists)

**Exit:** Deployable shell; doctor can log in. — **partially met** (desktop demo + API seed logins).

### Phase 1 — MVP “Prescribe & Remember” (Weeks 4–12)
Must-have:
1. Patient register/search  
2. Single-screen Rx editor + print  
3. Drug search (seeded DGHS subset, continuously expanded)  
4. Save Rx to patient timeline  
5. Basic multi-chamber switching  
6. Offline draft + sync for Rx/patients (core path)  
7. SMS or WhatsApp share of Rx link  
8. Assistant role: serial + patient create only  

**Pilot:** 20–50 doctors, Dhaka/Chattogram chambers.

**Exit criteria:** Median Rx < 90s; offline prescribe works; ≥70% pilot weekly retention.

### Phase 2 — Clinical Depth (Weeks 13–20)
- Full CDSS (DDI, allergy, pedes dosing helpers)
- Rx versioning + pharmacy verify QR
- Chronic condition panels + re-Rx packs
- Specialty templates library
- Follow-up reminders
- PDF/FHIR export (doctor-owned backup)
- Vitals capture in assistant portal
- Analytics for doctor (patients/day, top drugs)

**Exit:** Clear differentiation vs printer apps; safety story sellable.

### Phase 3 — Ecosystem & Scale (Weeks 21–32)
- Lab report attach + timeline
- Multi-device sync polish
- Optional Android companion for queue display
- Chamber billing / fee settlement reports
- Partner APIs (diagnostics chains)
- Performance hardening; regional failover
- BM&DC telemedicine-ready video consult hook (optional, compliant)

### Phase 4 — National Alignment (Months 9–14)
- Full DGHS Core FHIR interoperability pack
- National health ID readiness
- Enterprise clinic packages
- Advanced analytics / public-health aggregates (anonymized, consented)

---

## 10. MVP Feature Backlog (Prioritized)

### P0 (ship or MVP fails)
- [x] Doctor auth + profile + chambers *(API seed + JWT; desktop still demo OTP)*  
- [x] Patient CRUD + search by mobile *(API foundation; desktop still localStorage)*  
- [x] Drug autocomplete (normalized) *(local DGDA + PG ranked search)*  
- [x] Rx compose / sign / print *(desktop demo compose/print; API sign + share/verify stubs)*  
- [ ] Patient visit timeline (list of Rx)  
- [x] Offline save + sync for Rx *(local first + outbox flush to API; SQLite encryption still planned)*  
- [x] Share link (QR + SMS) *(share token + patient panel; SMS not wired)*  
- [x] Role: Doctor vs Assistant (basic) *(+ Super Admin, Admin, Patient, Pharmacist)*  

### P1 (pilot delight)
- [ ] 1-click re-prescribe  
- [ ] Templates  
- [ ] Bangla instructions library  
- [ ] Favorites / recent drugs  
- [ ] Pad header per chamber  
- [ ] Audit log viewer  

### P2 (moat)
- [ ] CDSS alerts + override log  
- [ ] Rx versions + pharmacy verify  
- [ ] FHIR + PDF export  
- [ ] Follow-up tracker  
- [ ] Lab attachments  

---

## 11. Drug Database Workstream (Critical Path)

1. Obtain / scrape-with-permission / license DGHS approved product list  
2. Schema: generic, salt composition, strength, form, brand, company, status  
3. Deduplicate & normalize Bangla/English names  
4. Build search index (typo-tolerant, Bangla phonetic if feasible)  
5. Curation admin UI for pharmacists/medical editors  
6. Versioned releases of KB pushed to clients for offline  
7. Map brands → interaction knowledge (partner DB or curated subset initially)

**Owner:** Backend + clinical content lead. Start Day 1 in parallel with UI.

---

## 12. CDSS Strategy (Safe & Credible)

- Phase 2 launch with **high-severity DDI + allergy + duplicate ingredient** only (avoid alert fatigue)  
- Pediatric dose calculator as helper, not hard block  
- Every alert: evidence note + severity + override reason required for high severity  
- Clinical advisory board (3–5 practicing BD physicians) to review rules  
- No generative AI writing final Rx without doctor confirmation  
- Document BM&DC compliance position in product + marketing  

---

## 13. UX Principles

1. **Chamber-speed:** every click is a cost; keyboard wins  
2. **One screen for Rx**  
3. **Bangla-first patient artifacts; bilingual doctor UI**  
4. **Offline is default, not an edge case**  
5. **Assistants never see what they don’t need**  
6. **Patients never forced to install**  
7. **Print must look like a trusted pad** (header, BM&DC no., signature block)  

Usability test weekly during Phase 1 with real doctors on real hardware (low-end laptops, 1366×768, weak Wi-Fi).

---

## 14. Go-to-Market & Packaging (Engineering-relevant)

### Monetization (from market intel)
Competitors: free acquisition → upsell; subscriptions ৳199–3,500/mo; hybrid lifetime offline ৳5,000 + cloud ৳12,000/yr. Price alone won’t win.

### Suggested packaging
| Plan | Includes | Indicative |
|---|---|---|
| Free Doctor | Limited Rx/month, 1 chamber, watermark | Acquisition |
| Pro | Unlimited Rx, offline, 3 chambers, SMS share | ৳799–1,499/mo |
| Clinic | Staff seats, RBAC, fee reports, priority support | ৳1,999–3,499/mo |
| Lifetime hybrid (later) | Strong offline license + annual sync fee | Competitive vs ZilSoft |

Engineering must meter: chambers, staff seats, SMS volume, storage.

---

## 15. Team & Roles (Lean)

| Role | Count (MVP) | Focus |
|---|---|---|
| Product / founder-MD advisor | 1 | Workflow truth |
| Full-stack lead | 1 | Architecture, sync |
| Frontend engineer | 1–2 | Rx workbench, PWA |
| Backend engineer | 1–2 | API, FHIR, jobs |
| Clinical data / pharmacist PT | 1 | Drug KB |
| Design (UI/print) | 1 (PT OK) | Pad + Bangla UX |
| QA | 1 | Offline + print matrix |

**Approx calendar:** 3 months to pilot-ready MVP with 4–6 people.

---

## 16. Delivery Cadence

- 2-week sprints  
- Demo every sprint to 2–3 pilot doctors  
- Freeze print CSS early (doctors judge by paper output)  
- Feature flags for CDSS / WhatsApp  
- Definition of Done includes offline test + Bangla print check  

---

## 17. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Drug DB quality incomplete | High | Start curated top 5k brands; expand; pharmacist review |
| Sync conflicts corrupt Rx | Critical | Immutable signed versions; server sequence numbers |
| Alert fatigue kills CDSS trust | High | Ship few high-precision alerts first |
| WhatsApp API / SMS cost | Medium | QR-first; SMS fallback; metered plans |
| Doctors resist workflow change | High | Import from paper habits; 1-click re-Rx; onboarding in chamber |
| Competitor price war | Medium | Compete on speed/EHR/offline/safety, not cheapest |
| Regulatory / BM&DC AI rules | High | Doctor-in-loop only; legal review |
| PHI breach | Critical | Encryption, RBAC, pen-test before scale |
| Load-shedding + old PCs | High | Lightweight PWA; local-first; low RAM profile |

---

## 18. Compliance Checklist

- [ ] BM&DC doctor verification at signup  
- [ ] Telemedicine guideline adherence (if video added)  
- [ ] No unlawful AI autonomous prescribing claims  
- [ ] DGHS FHIR alignment roadmap documented  
- [ ] Patient consent for digital share  
- [ ] Data export & deletion policy  
- [ ] Audit logs retained (define period, e.g. 6 years clinical)  
- [ ] Privacy policy in Bangla + English  

---

## 19. Testing Strategy

- **Unit:** dose parsing, drug search ranking, RBAC guards  
- **Integration:** sync outbox, Rx versioning, share tokens  
- **E2E:** prescribe offline → go online → sync → patient opens link  
- **Print matrix:** Chrome/Edge, A4/A5, common chamber printers  
- **Performance:** Rx search < 100ms local; page TTI on 4G  
- **Security:** authz tests for assistant cannot read notes  
- **Clinical content:** sample DDI cases reviewed by advisors  

---

## 20. Pilot Plan

1. Recruit 20 doctors (mix of GP + 2–3 specialties)  
2. Install/onboard in-chamber (1 hour)  
3. Run 4 weeks parallel with old method  
4. Measure: time/Rx, offline incidents, re-Rx usage, NPS  
5. Weekly fix loop; then expand to 50  
6. Case studies for GTM  

---

## 21. 90-Day Plan (Concrete)

### Days 1–30
- Architecture spike (offline sync prototype)
- Rx editor clickable prototype
- DGHS drug ingest pipeline v0
- Auth + chamber + patient APIs
- Print template v1
- **TODO(dgda-auto-import):** Automated DGDA → Postgres `medicines` sync (detect new drugs, upsert, refresh offline pack; preserve Super Admin ranking)

### Days 31–60
- End-to-end prescribe online
- Offline prescribe path
- SMS/QR share
- Assistant portal v0
- Internal dogfood + 5 friendly doctors

### Days 61–90
- Pilot with 20 doctors
- Stability, sync edge cases
- Onboarding checklist + Bangla help
- Pricing experiment ready
- Phase 2 backlog locked (CDSS, versioning)

---

## 22. Open Decisions (Resolve Early)

1. Web PWA only vs Electron desktop for deep offline? **Recommend PWA first; desktop if pilots demand.**  
2. Build vs license DDI knowledge base?  
3. WhatsApp BSP partner selection  
4. Patient identity: phone-primary vs national ID later  
5. Multi-doctor shared patient chart consent model  
6. Brand/product final name  

---

## 23. Immediate Next Actions

1. Approve this plan and freeze MVP scope (P0 list)  
2. Hire/assign full-stack lead + clinical data owner  
3. Start drug KB pipeline and Rx editor prototype in parallel  
4. Recruit 10 design-partner doctors this month  
5. Draft privacy/ToS and BM&DC compliance note  
6. Set up repo, CI, staging, error tracking  

---

## 24. Appendix — Competitive Positioning One-liner

> While others print prescriptions, **Clinical OS** keeps the doctor practicing through load-shedding, remembers every patient across every chamber, and catches dangerous drug mistakes—without forcing patients to install an app.

---

*Prepared from market findings E-Rx/BD-STRAT/2026/01. For internal product & engineering use.*

# Unified Clinical Practice Platform — Full Development Plan (SDP)

**প্রোডাক্ট working name:** Clinical OS (BD)  
**ট্যাগলাইন:** One Doctor. One Patient Record. Every Chamber.  
**উৎস:** E-Rx/BD-STRAT/2026/01 (18 Nov 2026)  
**ডকুমেন্ট ধরন:** Software Development Plan (SDP)  
**স্ট্যাটাস:** Draft v1.0  
**দর্শক:** Founders, engineering, product, compliance  

**রানটাইম নোট (repo বর্তমান):** ডিফল্ট **native local PostgreSQL** + NestJS API; **Docker optional** (scale lab)।

---

## 1. Executive Intent (মূল উদ্দেশ্য)

বাংলাদেশের জন্য **Unified Clinical Practice Platform** বানানো — আরেকটা prescription printer নয়। বাজারের ১৯+ competitor-এর বেশিরভাগ কাগজের প্যাড digitize করে। Doctor-দের ৮০.৯% continuous medical history platform চায়; মাত্র ৪.৮% শুধু digital record; ৫১.৪% এখনও paper।

**আমরা যেখানে জিতব:**

- keyboard-fast prescribing  
- offline-first reliability  
- DGHS-normalized drugs  
- real CDSS  
- multi-chamber EHR  
- RBAC privacy  
- patient-এর জন্য no-install access  
- FHIR/data portability  

---

## 2. Problem → Solution Map

| Market flaw | Product response |
|---|---|
| Slow manual typing / mouse-heavy UI | Single-screen keyboard-first Rx workbench; 1-click re-Rx; specialty templates |
| Dirty drug DB (duplicates, withdrawn brands) | DGHS-certified normalized formulary (~39,196 products) |
| No clinical context (age/weight/pregnancy/renal) | Context-aware prescribing + CDSS |
| Weak / fatiguing DDI alerts | Evidence-based, severity-ranked, BMDC-compliant CDSS |
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
| No DGHS FHIR / BMDC telemed compliance | Design to Core FHIR; doctor-controlled AI; no illegal AI prescribing |

---

## 3. Product Vision & Non-Goals

### Vision (ভিশন)

বাংলাদেশি private practice-এর **clinical operating system**: ৬০ সেকেন্ডের নিচে prescribe, জীবনভর patient context, internet ছাড়া কাজ, privacy রক্ষা, জাতীয় health infrastructure-এর সাথে প্রস্তুত সংযোগ।

### Non-goals (Phase 0–1)

- Full hospital HIS/LIS/RIS replacement  
- Inpatient ward management  
- Insurance claims adjudication (পরে)  
- Consumer wellness / fitness app  
- Autonomous AI prescribing (BMDC-তে নিষিদ্ধ)  

---

## 4. Target Users & Personas

1. **Specialist doctor (multi-chamber)** — primary buyer; speed + history + chambers  
2. **GP / chamber doctor** — templates, Bengali instructions, offline  
3. **Receptionist / assistant** — serial, fee, vitals; clinical chart নয় (`apps/web-assistant` foundation)  
4. **Patient (any age/literacy)** — SMS/WhatsApp/QR দিয়ে Rx  
5. **Pharmacist** — authenticity / latest version verify  
6. **Lab partner (পরে)** — digital report chart-এ  

**ICP:** BMDC-registered doctor, urban/semi-urban chamber, ≥১৫ patient/day, ≥২ location, paper বা printer-only tool থেকে switch।

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

- Single-screen editor (tab hopping নেই)  
- Keyboard navigation, fuzzy drug search, favorite sets (**TODO:** favorites per-doctor, discipline-based)  
- 1-click re-prescribe from last / chronic meds  
- Specialty templates  
- Bangla + English auto-instructions  
- Print + digital share এক action-এ  
- Rx versioning (amend → new version; superseded mark)  

### P2. Offline-First Architecture

- Local encrypted store (IndexedDB / SQLite / OPFS)  
- Offline-এ full prescribe / save / local print  
- Online হলে conflict-aware background sync  
- Sync status indicator; pending ops queue  
- Multi-device (পরে): phone + laptop same doctor  

### P3. Unified Longitudinal EHR

- Doctor network-এ master patient ID (পরে consent সহ cross-doctor)  
- Timeline: visits, Rx, vitals, allergies, chronic, labs  
- Chronic disease panels (DM, HTN, asthma, …)  
- Phone / name / ID দিয়ে search  

### P4. DGHS Drug Knowledge Base

- DGHS list ingest ও normalize  
- Generic ↔ brand ↔ formulation ↔ manufacturer  
- Withdrawn / unavailable flag  
- Offline search local cache  
- Admin curation update workflow  
- **TODO(dgda-auto-import):** automated DGDA → Postgres `medicines` sync, offline pack refresh, ranking preserve  

### P5. Clinical Decision Support (CDSS)

- DDI (severity-ranked)  
- Allergy / duplicate ingredient alert  
- Pediatric dosing helper (age/weight)  
- Pregnancy / lactation / renal / hepatic caution  
- Doctor override সবসময়; high-severity override log  
- BMDC-aligned: assistive, autonomous prescribe নয়  

**Allergy:** assistant allergy chart edit করতে পারে না; doctor workbench-এ maintain।

### P6. Multi-Chamber + RBAC

- Chamber: address, pad header, fee, hours  
- Roles: Doctor (owner), Assistant, Receptionist  
- Assistant portal: queue/serial, vitals, payments — **full chart নেই**  
- Access ও Rx change audit log  

### P7. No-Install Patient + Ecosystem

- SMS, WhatsApp, QR deep link  
- Patient view: Rx, Bangla instruction, follow-up  
- Pharmacy verify endpoint  
- Lab report attach (Phase 2)  

### P8. Standards & Portability

- DGHS Core FHIR-aligned resources  
- One-click export: FHIR Bundle + PDF archive  
- National health ID readiness  
- Transparent data ownership  

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
│ Sync / API Gateway │───▶│ Auth (OTP + BMDC verify)    │
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

**আজকের repo:** NestJS API + **PostgreSQL (native default)**; Redis/Nginx/Docker **optional**।

### 7.2 Suggested stack (BD market)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js / React PWA + TypeScript | Fast UI, offline service worker |
| Local DB | Dexie (IndexedDB) or SQLite WASM | Offline-first |
| Backend | NestJS or FastAPI | Clear modules, typed APIs |
| Primary DB | PostgreSQL | Relational clinical + JSONB |
| Jobs | Redis + BullMQ / Celery | SMS, sync, exports |
| Auth | Phone OTP + email; BMDC license verify | Doctor trust |
| Print | Browser print CSS + PDF | Chamber printers |
| Notify | SMS gateway + WhatsApp Business API | Patient reach |
| Hosting | BD-friendly / regional cloud | Latency + cost |
| Observability | Sentry + structured logs | Reliability |

### 7.3 Offline sync principles

1. Optimistic local writes + client UUID  
2. Vector clocks / `updated_at` + `device_id` conflict detect  
3. Server authoritative Rx version numbers  
4. Offline Rx কখনো হারায় না — queue until ack  
5. Device-এ PHI encrypted at rest  

### 7.4 Security & privacy baseline

- TLS; PHI encrypt at rest  
- RBAC every clinical endpoint  
- Assistant field-level restriction  
- Audit trail  
- SMS link-এ minimal PII (signed short token)  
- Backup RPO ≤ 1h, RTO ≤ 4h (cloud tier)  
- Bangladesh Digital Security Act practices + health data ethics  

---

## 8. Domain Model (Core Entities)

- **User** — roles, BMDC license, chambers  
- **Chamber** — branding/pad, fees, location  
- **Patient** — demographics, phones, master ID  
- **Encounter / Visit** — chamber, serial, vitals, chief complaint  
- **Prescription** — versions, draft/signed/superseded, med lines  
- **MedicationLine** — drug ref, dose, route, frequency, duration, Bangla instruction  
- **DrugProduct / Generic** — DGHS-normalized KB  
- **Allergy, Condition, Observation** — EHR  
- **AlertEvent** — CDSS fired / overridden  
- **ShareLink** — patient/pharmacy tokens  
- **AuditLog** — immutable events  
- **SyncOutbox** — offline ops  

FHIR mapping: `Patient`, `Practitioner`, `Organization`, `Encounter`, `MedicationRequest`, `Medication`, `AllergyIntolerance`, `Condition`, `Observation`, `Provenance`.

---

## 9. Phased Roadmap

### Phase 0 — Foundations (Weeks 1–3)

- [x] Repo layout + developer handbook + doc sync  
- [x] Base DB schema + migrations (PostgreSQL + Prisma)  
- [x] Auth shell (JWT + demo OTP); BMDC field on User  
- [x] Multi-role RBAC + admin / assistant / patient / pharmacy panels  
- [x] Drug KB in Postgres + Super Admin search ranking  
- [x] Docker Compose + Nginx scale profile + k6 harness (**optional**, ডিফল্ট native PG)  
- [ ] CI/CD, stage/prod environments  
- [x] Design system start (Bangla typography, print layouts kit)  
- [ ] Legal: ToS, privacy, data ownership draft  
- [ ] Competitor UX teardown → Rx editor wireframes  

**Exit:** Deployable shell; doctor login। — **partially met** (desktop demo + API seed logins)।

### Phase 1 — MVP “Prescribe & Remember” (Weeks 4–12)

Must-have:

1. Patient register/search  
2. Single-screen Rx editor + print  
3. Drug search (DGHS subset seed, continuously expand)  
4. Save Rx to patient timeline  
5. Basic multi-chamber switching  
6. Offline draft + sync for Rx/patients  
7. SMS or WhatsApp share of Rx link  
8. Assistant role: serial + patient create only  

**Pilot:** ২০–৫০ doctor, Dhaka/Chattogram chambers।

**Exit:** Median Rx < 90s; offline prescribe; ≥70% pilot weekly retention।

### Phase 2 — Clinical Depth (Weeks 13–20)

- Full CDSS (DDI, allergy, peds dosing)  
- Rx versioning + pharmacy verify QR  
- Chronic panels + re-Rx packs  
- Specialty templates  
- Follow-up reminders  
- PDF/FHIR export  
- Assistant portal vitals  
- Doctor analytics  

### Phase 3 — Ecosystem & Scale (Weeks 21–32)

- Lab report attach  
- Multi-device sync polish  
- Optional Android queue display  
- Chamber billing reports  
- Partner APIs  
- Performance hardening; regional failover  
- BMDC telemedicine-ready video hook (optional)  

### Phase 4 — National Alignment (Months 9–14)

- Full DGHS Core FHIR pack  
- National health ID readiness  
- Enterprise clinic packages  
- Advanced analytics (anonymized, consented)  

---

## 10. MVP Feature Backlog (Prioritized)

### P0 (ship or MVP fails)

- [x] Doctor auth + profile + chambers *(API seed + JWT)*  
- [x] Patient CRUD + search by mobile  
- [x] Drug autocomplete *(local DGDA + PG ranked search)*  
- [x] Rx compose / sign / print *(desktop demo; API stubs)*  
- [ ] Patient visit timeline (list of Rx)  
- [x] Offline save + sync for Rx *(outbox flush; SQLite encryption planned)*  
- [x] Share link (QR + SMS) *(SMS not wired)*  
- [x] Role: Doctor vs Assistant *(+ Super Admin, Admin, Patient, Pharmacist)*  

### P1 (pilot delight)

- [ ] 1-click re-prescribe  
- [ ] Templates  
- [ ] Bangla instructions library  
- [ ] Favorites / recent drugs (**TODO:** per-doctor, discipline-based)  
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

1. DGHS approved product list obtain / license  
2. Schema: generic, salt, strength, form, brand, company, status  
3. Deduplicate Bangla/English names  
4. Search index (typo-tolerant, Bangla phonetic যদি feasible)  
5. Curation admin UI  
6. Versioned KB offline client push  
7. Brand → interaction knowledge map  

**TODO(dgda-auto-import):** Automated DGDA → Postgres `medicines` upsert, offline pack refresh, Super Admin ranking preserve।

**Owner:** Backend + clinical content lead। UI-র পাশাপাশি Day 1 শুরু।

---

## 12. CDSS Strategy (Safe & Credible)

- Phase 2: **high-severity DDI + allergy + duplicate ingredient** প্রথমে  
- Pediatric dose calculator helper, hard block নয়  
- High-severity override-এ reason required  
- Clinical advisory board (৩–৫ BD physician)  
- Generative AI final Rx doctor confirmation ছাড়া নয়  
- BMDC compliance position product + marketing-এ document  

---

## 13. UX Principles

1. **Chamber-speed:** প্রতি click খরচ; keyboard জিতে  
2. **One screen for Rx**  
3. **Bangla-first patient artifacts; bilingual doctor UI**  
4. **Offline default, edge case নয়**  
5. **Assistant শুধু যা দরকার তাই দেখে**  
6. **Patient কখনো install বাধ্য নয়**  
7. **Print trusted pad-এর মতো** (header, BMDC no., signature)  

Phase 1-এ সাপ্তাহিক usability test — low-end laptop, 1366×768, weak Wi-Fi।

---

## 14. Go-to-Market & Packaging (Engineering-relevant)

### Monetization

Competitors: free → upsell; ৳১৯৯–৩,৫০০/mo; hybrid lifetime offline ৳৫,০০০ + cloud ৳১২,০০০/yr।

### Suggested packaging

| Plan | Includes | Indicative |
|---|---|---|
| Free Doctor | Limited Rx/month, 1 chamber, watermark | Acquisition |
| Pro | Unlimited Rx, offline, 3 chambers, SMS share | ৳799–1,499/mo |
| Clinic | Staff seats, RBAC, fee reports, priority support | ৳1,999–3,499/mo |
| Lifetime hybrid (later) | Strong offline + annual sync fee | vs ZilSoft competitive |

Engineering meter: chambers, staff seats, SMS volume, storage।

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

**≈ 3 months** pilot-ready MVP, ৪–৬ জন।

---

## 16. Delivery Cadence

- 2-week sprints  
- Sprint demo ২–৩ pilot doctor  
- Print CSS আগে freeze  
- Feature flags CDSS / WhatsApp  
- DoD: offline test + Bangla print check  

---

## 17. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Drug DB incomplete | High | Top 5k brands curated; expand; pharmacist review |
| Sync conflicts corrupt Rx | Critical | Immutable signed versions; server sequence |
| Alert fatigue | High | Few high-precision alerts first |
| WhatsApp / SMS cost | Medium | QR-first; SMS fallback; metered plans |
| Doctors resist change | High | Paper habits import; 1-click re-Rx; in-chamber onboarding |
| Competitor price war | Medium | Speed/EHR/offline/safety, not cheapest |
| Regulatory / BMDC AI | High | Doctor-in-loop only; legal review |
| PHI breach | Critical | Encryption, RBAC, pen-test |
| Load-shedding + old PCs | High | Lightweight PWA; local-first; low RAM |

---

## 18. Compliance Checklist

- [ ] BMDC doctor verification at signup  
- [ ] Telemedicine guideline (video added হলে)  
- [ ] No unlawful AI autonomous prescribing claims  
- [ ] DGHS FHIR alignment roadmap documented  
- [ ] Patient consent for digital share  
- [ ] Data export & deletion policy  
- [ ] Audit logs retained (e.g. 6 years clinical)  
- [ ] Privacy policy Bangla + English  

---

## 19. Testing Strategy

- **Unit:** dose parsing, drug search ranking, RBAC guards  
- **Integration:** sync outbox, Rx versioning, share tokens  
- **E2E:** offline prescribe → online → sync → patient opens link  
- **Print matrix:** Chrome/Edge, A4/A5, chamber printers  
- **Performance:** local Rx search < 100ms; 4G TTI  
- **Security:** assistant cannot read clinical notes / edit allergies  
- **Clinical content:** sample DDI advisor review  

---

## 20. Pilot Plan

1. ২০ doctor recruit (GP + ২–৩ specialty mix)  
2. In-chamber onboard (~১ hour)  
3. ৪ সপ্তাহ parallel old method  
4. Measure: time/Rx, offline, re-Rx, NPS  
5. Weekly fix; ৫০ পর্যন্ত expand  
6. GTM case studies  

---

## 21. 90-Day Plan (Concrete)

### Days 1–30

- Architecture spike (offline sync prototype)  
- Rx editor clickable prototype  
- DGHS drug ingest pipeline v0  
- Auth + chamber + patient APIs  
- Print template v1  
- **TODO(dgda-auto-import):** Automated DGDA → Postgres `medicines` sync (new drugs detect, upsert, offline pack refresh; Super Admin ranking preserve)  

### Days 31–60

- End-to-end prescribe online  
- Offline prescribe path  
- SMS/QR share  
- Assistant portal v0 (`apps/web-assistant`)  
- Internal dogfood + ৫ friendly doctors  

### Days 61–90

- ২০ doctor pilot  
- Stability, sync edge cases  
- Onboarding checklist + Bangla help  
- Pricing experiment  
- Phase 2 backlog lock (CDSS, versioning)  

---

## 22. Open Decisions (Resolve Early)

1. Web PWA only vs Electron desktop? **Recommend PWA first; desktop if pilots demand.**  
2. Build vs license DDI knowledge base?  
3. WhatsApp BSP partner  
4. Patient identity: phone-primary vs national ID later  
5. Multi-doctor shared chart consent  
6. Final brand/product name  

---

## 23. Immediate Next Actions

1. Plan approve + MVP scope (P0) freeze  
2. Full-stack lead + clinical data owner assign  
3. Drug KB pipeline + Rx editor parallel start  
4. ১০ design-partner doctors এই মাস  
5. Privacy/ToS + BMDC compliance note draft  
6. Repo, CI, staging, error tracking  

---

## 24. Appendix — Competitive Positioning One-liner

> While others print prescriptions, **Clinical OS** keeps the doctor practicing through load-shedding, remembers every patient across every chamber, and catches dangerous drug mistakes—without forcing patients to install an app.

---

*Prepared from market findings E-Rx/BD-STRAT/2026/01. Internal product & engineering use.*
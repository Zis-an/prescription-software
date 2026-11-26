# Clinical OS — Entry points & role workflows

**Audience:** Product, engineering, clinic ops  
**Companion:** [`WORKFLOW.md`](./WORKFLOW.md) (narrative) · [`USAGE_GUIDE.md`](./USAGE_GUIDE.md) (screens)

GitHub renders the Mermaid diagrams below. Colors: Assistant (blue) · Doctor (green) · Patient (teal) · Pharmacy (orange) · Admin (purple).

---

## 1. Visit lifecycle (chamber-day happy path)

```mermaid
flowchart LR
  A["1 Arrival<br/>Find / register"]:::assistant
  B["2 Queue<br/>Serial · fee · vitals"]:::assistant
  C["3 Consult<br/>Complaint · Dx"]:::doctor
  D["4 Compose<br/>Drugs · CDSS"]:::doctor
  E["5 Sign<br/>Print · share"]:::doctor
  F["6 Patient<br/>SMS · QR · pad"]:::patient
  G["7 Pharmacy<br/>Verify latest"]:::pharmacy

  A --> B --> C --> D --> E
  E --> F
  E --> G
  F --> G

  classDef assistant fill:#1e3a5f,stroke:#60a5fa,color:#e2e8f0
  classDef doctor fill:#14532d,stroke:#4ade80,color:#e2e8f0
  classDef patient fill:#134e4a,stroke:#2dd4bf,color:#e2e8f0
  classDef pharmacy fill:#7c2d12,stroke:#fb923c,color:#e2e8f0
```

---

## 2. App entry points

| Actor | Surface | What they open |
|---|---|---|
| **Doctor** | Desktop / doctor PWA (`apps/desktop`) | Workbench · Queue · Patients |
| **Assistant** | `apps/web-assistant` (:5174) | Serial · fee · vitals |
| **Patient** | `apps/web-patient` · share link | No app install |
| **Pharmacist** | `apps/web-pharmacy` · QR | Verify latest version |
| **Admin** | `apps/web-admin` (:5173) | Doctors · Drug KB · audit |

```mermaid
flowchart TB
  subgraph clients["Role surfaces"]
    Doc["Doctor<br/>desktop · doctor PWA<br/>Workbench · Queue · Patients"]:::doctor
    Ast["Assistant<br/>web-assistant :5174<br/>Serial · fee · vitals"]:::assistant
    Pat["Patient<br/>web-patient · share link<br/>No app install"]:::patient
    Pha["Pharmacist<br/>web-pharmacy · QR<br/>Verify latest version"]:::pharmacy
    Adm["Admin<br/>web-admin :5173<br/>Doctors · KB · audit"]:::admin
  end

  API["API · Auth · RBAC · Sync · Audit"]

  Doc --> API
  Ast --> API
  Pat --> API
  Pha --> API
  Adm --> API

  classDef assistant fill:#1e3a5f,stroke:#60a5fa,color:#e2e8f0
  classDef doctor fill:#14532d,stroke:#4ade80,color:#e2e8f0
  classDef patient fill:#134e4a,stroke:#2dd4bf,color:#e2e8f0
  classDef pharmacy fill:#7c2d12,stroke:#fb923c,color:#e2e8f0
  classDef admin fill:#4c1d95,stroke:#c084fc,color:#e2e8f0
```

---

## 3. Role workflows

### 3.1 Doctor

**Entry:** OTP + BMDC · select chamber

```mermaid
flowchart TD
  D1["1 Open Queue<br/>Waiting → Current"]:::doctor
  D2["2 Workbench<br/>Allergies · vitals"]:::doctor
  D3["3 Compose Rx<br/>DGDA search"]:::doctor
  D4["4 CDSS checks<br/>Override if needed"]:::doctor
  D5["5 Sign & print / Share<br/>Ctrl+Enter · SMS · QR"]:::doctor
  D6["6 Next serial<br/>Or re-Rx history"]:::doctor

  D1 --> D2 --> D3 --> D4 --> D5 --> D6
  D6 -.-> D1

  classDef doctor fill:#14532d,stroke:#4ade80,color:#e2e8f0
```

Offline path: local write → outbox → sync when online.

### 3.2 Assistant / Receptionist

**Entry:** Staff login · `web-assistant`

```mermaid
flowchart LR
  A1["1 Search<br/>Mobile / name"]:::assistant
  A2["2 Register<br/>Demographics only"]:::assistant
  A3["3 Serial + fee<br/>Vitals capture"]:::assistant
  A4["4 Queue<br/>Status: Waiting"]:::assistant
  A5["5 Serial slip"]:::assistant

  A1 --> A2 --> A3 --> A4 --> A5

  classDef assistant fill:#1e3a5f,stroke:#60a5fa,color:#e2e8f0
```

**Forbidden:** diagnosis · medications · allergies · clinical advice.

### 3.3 Patient

**Entry:** SMS · WhatsApp · QR · paper pad

```mermaid
flowchart LR
  P1["1 Receive Rx<br/>Link or paper"]:::patient
  P2["2 Open share view<br/>EN / BN instructions"]:::patient
  P3["3 Show pharmacy<br/>QR / verify URL"]:::patient

  P1 --> P2 --> P3

  classDef patient fill:#134e4a,stroke:#2dd4bf,color:#e2e8f0
```

No install. Use the newest link if the Rx was amended.

### 3.4 Pharmacist

**Entry:** QR on pad or patient phone

```mermaid
flowchart LR
  H1["1 Scan QR<br/>Pad or share"]:::pharmacy
  H2["2 Confirm latest<br/>Reject superseded"]:::pharmacy
  H3["3 Dispense lines<br/>Dose · form · days"]:::pharmacy

  H1 --> H2 --> H3

  classDef pharmacy fill:#7c2d12,stroke:#fb923c,color:#e2e8f0
```

Confirm patient identity, BMDC, and chamber before dispense.

### 3.5 Platform Admin

**Entry:** `SUPER_ADMIN` / `ADMIN` · `web-admin`

```mermaid
flowchart TD
  S1["1 Doctors<br/>BMDC registry"]:::admin
  S2["2 Chambers<br/>Link · hours · fee"]:::admin
  S3["3 Drug KB<br/>DGDA · ranking"]:::admin
  S4["4 Audit<br/>rx.sign · access"]:::admin
  S5["5 Settings<br/>Pad language · SMS / WhatsApp"]:::admin

  S1 --> S2 --> S3 --> S4 --> S5

  classDef admin fill:#4c1d95,stroke:#c084fc,color:#e2e8f0
```

---

## 4. Related docs

| Doc | Purpose |
|---|---|
| [`WORKFLOW.md`](./WORKFLOW.md) | Full clinical / ops workflow |
| [`USAGE_GUIDE.md`](./USAGE_GUIDE.md) | Day-to-day screens per role |
| [`DEVELOPER.md`](./DEVELOPER.md) | Architecture and modules |
| [`../README.md`](../README.md) | Repo overview and seeded logins |

# ARCHITECTURE — Systemarkitektur

## Översikt
```mermaid
flowchart LR
  GA4[(GA4 API/BigQuery)] -->|extract| ETL[Transform & Validate]
  ETL --> CACHE[(Redis/DB)]
  CACHE --> API[Backend API (FastAPI/Next API)]
  API --> UI[Next.js Dashboard]
  ETL --> AI[OpenAI Analysis]
  AI --> API
  API --> EXPORT[CSV/XLSX/JSON]
```

## Katalogstruktur (förslag)
```
/apps
  /dashboard (Next.js)
    /app
    /components
    /lib
    /styles
    /env
    /tests
  /api (FastAPI/Flask eller Next API)
    /routers
    /services
    /models
    /jobs
    /tests
/packages
  /analytics-core (Python/TS: datamodeller, transformers, validators)
  /prompts (MD: SYSTEM, RULES, STATE, TEMPLATES)
  /config (yaml + schema)
/infra
  docker, compose, terraform (valfritt)
```

## Data Contracts (exempel, TypeScript)
```ts
export type DateRange = { start: string; end: string };

export interface Ga4Kpi {
  date: string; // YYYY-MM-DD
  sessions: number;
  users: number;
  pageviews: number;
  conversions: number;
  revenue?: number;
  device?: string;
  channel?: string;
}

export interface Insight {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  kpis: Partial<Ga4Kpi>;
  evidence: string[]; // datapunkter/källor
  recommendation: string; // åtgärd
  confidence: "low" | "medium" | "high";
}
```

## API‑Endpoints (förslag)
- `GET /kpi?range=last_30d` – tidsserier för sessions/users/pageviews/conversions.
- `GET /channels?range=...` – kanalprestanda med CR och revenue.
- `GET /insights?range=...` – AI‑genererade insikter (cache: 1h).
- `POST /analyze` – kör AI‑analys på given dataset/urval.
- `GET /export.xlsx?range=...` – exportera Excel.

## Caching & Jobs
- Cachea idempotenta läsningar (t.ex. 15–60 min).
- Nattliga jobb: refresh av basdata, veckojobb för djupanalys.
- Re‑try med backoff mot GA4 API‑limits.

## Observability
- Structured logs (json).
- Health checks `/health` för API och workers.
- Minimal metrics: qps, latens p95, felgrad, misslyckade jobbkörningar.

# STATE — Konfig, tillstånd och miljö

## Miljövariabler (exempel)
```
GA4_PROPERTY_ID=
GOOGLE_APPLICATION_CREDENTIALS=/secrets/ga4.json
OPENAI_API_KEY=
CACHE_URL=redis://localhost:6379
DATABASE_URL=postgres://user:pass@host:5432/db
NODE_ENV=development
```

## Konfig (config.yaml – utdrag)
```yaml
defaults:
  daterange: last_30d
  channels:
    include:
      - Organic Search
      - Paid Search
      - Paid Social
      - Direct
      - Referral
      - Email
      - Display
analytics:
  kpis:
    - sessions
    - users
    - pageviews
    - conversions
    - revenue
  anomalies:
    spike_threshold: 0.30
    dip_threshold: -0.20
ai:
  model: "gpt-4o-mini"
  temperature: 0.1
  max_tokens: 1500
  style:
    bullets: true
    tables_language: "sv"
export:
  formats:
    - csv
    - xlsx
```

## Prompt‑state (delad kontext)
- Laddade filer: SYSTEM.md, RULES.md, ARCHITECTURE.md, STATE.md.
- Aktivt datumintervall och dimensioner (range, channels, device, geo).
- Senaste körningens summariserad data (aggregerad json + provenance).

## Minnen & Logg
- Spara senaste 5 körningars *Executive Summary* + rekommendationer.
- Länka alla insikter till data‑hash (för spårbarhet).

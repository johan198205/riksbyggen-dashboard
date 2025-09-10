# SYSTEM — GA4 + OpenAI Dashboard (Cursor Prompt Foundation)

Denna fil beskriver systemets syfte, avgränsningar och icke‑mål så att alla agenter/verktyg i Cursor kan hålla sig inom ramen.

## Syfte
- Samla in och transformera data från GA4 (via API/BigQuery-export) till ett analysvänligt format.
- Köra AI‑driven analys (OpenAI) för insikter, avvikelser, rekommendationer och sammanfattningar.
- Presentera data och AI‑insikter i ett modernt dashboard (Next.js/React) med server‑driven API‑layer (Flask/FastAPI/Next API routes).
- Exportera rapporter (Excel/CSV/JSON) och generera beslutsunderlag.

## Huvudmål
1. Tillförlitlig datagrund: ren, validerad och versionerad.
2. Spårbar AI‑analys: varje insikt ska kunna härledas till data och parametrar.
3. Snabb väg till värde: färdiga mallar för KPI‑översikt, kanalprestanda, avvikelser, trender och rekommendationer.
4. Skalbarhet: modulärt och lätt att byta ut datakällor och modellversioner.

## Icke-mål
- Ersätta hela BI-stackar. Dashboarden kompletterar befintliga verktyg.
- Bygga proprietär datalagring. Vi nyttjar existerande datalager (GA4 API/GCS/BigQuery) där möjligt.
- Komplett ML-pipeline för prediktion. Fokus är diagnostik och förslag.

## Datasäkerhet & Sekretess
- Hantera API‑nycklar via miljövariabler. Aldrig hårdkoda nycklar.
- Pseudonymisera/anonymisera persondata. Inga personuppgifter lagras utanför GA4:s tillåtna ytor.
- Logga endast nödvändig metadata för felsökning. Rensa känslig data i loggar.

## Övergripande flöde
1. **Ingestion**: Hämta GA4-data (Sessions, Users, Conversions, Pageviews, Channels, Geo, Device).
2. **Transform**: Normalisera, join:a dimensioner, beräkna härledda KPI:er, skapa tidsserier.
3. **Validation**: Schema- och plausibilitetskontroller. Flagga avvikelser.
4. **AI‑Analys**: Prompta OpenAI med strikt kontext (SYSTEM/RULES/STATE) och datasammanfattningar.
5. **Presentation**: Servera API-endpoints till Next.js UI. Visa tabeller, KPI‑kort, diagram och rekommendationer.
6. **Export**: Generera rapporter (CSV/XLSX) och korta sammanfattningar för stakeholders.

## Tekniska pelare
- **Frontend**: Next.js (app router), Tailwind, shadcn/ui, Recharts.
- **Backend**: Python (FastAPI/Flask) eller Next.js API routes. Job queue för schemalagda körningar.
- **Data**: GA4 Data API / BigQuery export. Cache i Redis/SQLite/Postgres beroende på skala.
- **AI**: OpenAI (text- och eventuell vision‑modell). Prompt‑arkitektur i separata MD-filer.
- **Observability**: strukturerad loggning, hälsokontroller, enkel metrics (latens, fel, throughput).

## Framgångskriterier
- < 1h setup till första insikt.
- < 3s p95 API‑latens på nyckelendpoints.
- Minst 5 actionable rekommendationer/vecka.

# Vercel GA4 Setup Guide

## Problem
Vercel har problem med Google Cloud-autentisering för GA4 Data API. Felet "Could not load the default credentials" uppstår eftersom Vercel inte kan hitta eller använda Google Cloud-autentiseringen.

## Lösningar

### Lösning 1: Hybrid Service (Rekommenderad)
Den nya `ga4-hybrid.service.ts` försöker flera autentiseringsmetoder i ordning:

1. **JSON String** (Vercel Production): `GOOGLE_APPLICATION_CREDENTIALS_JSON`
2. **File Path** (Local Development): `GOOGLE_APPLICATION_CREDENTIALS`
3. **Default Credentials** (GCP Environment)

### Lösning 2: Vercel Environment Variables
Kontrollera att följande environment variables är korrekt konfigurerade på Vercel:

```
GA4_PROPERTY_ID=249591466
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
```

### Lösning 3: Vercel Google Cloud Integration
1. Gå till Vercel Dashboard → Project Settings → Integrations
2. Lägg till Google Cloud Platform integration
3. Välj rätt projekt och ge nödvändiga behörigheter

### Lösning 4: Service Account Permissions
Kontrollera att service account har rätt behörigheter:
- Google Analytics Data API
- Analytics Viewer eller Analytics Editor

## Debugging

### Loggar att kolla
- Vercel Function Logs
- Browser Console
- Network tab för API-anrop

### Vanliga fel
- `3 INVALID_ARGUMENT`: Felaktig property ID eller behörigheter
- `Could not load default credentials`: Autentiseringsproblem
- `GA4 client not initialized`: Miljövariabler saknas

## Testning

### Lokalt
```bash
npm run dev
# Kolla http://localhost:3004/api/ga4/metrics?days=28
```

### På Vercel
```bash
# Kolla Vercel Function Logs
# Testa API: https://your-app.vercel.app/api/ga4/metrics?days=28
```

## Nästa steg
Om hybrid-servicen inte fungerar, kan vi prova:
1. OAuth2-baserad autentisering
2. Vercel's inbyggda Google Cloud-integration
3. Extern API-proxy

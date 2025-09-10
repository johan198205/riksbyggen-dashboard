# OAuth2 Setup för GA4 (Utan Service Account)

## Varför OAuth2?
- Inga komplicerade service account JSON-filer
- Enklare att hantera på Vercel
- Bara en access token behövs

## Steg 1: Skapa OAuth2 Credentials

1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Välj ditt projekt
3. Gå till "APIs & Services" → "Credentials"
4. Klicka "Create Credentials" → "OAuth 2.0 Client IDs"
5. Välj "Web application"
6. Lägg till din Vercel-domän i "Authorized redirect URIs"

## Steg 2: Få Access Token

### Metod 1: Google OAuth2 Playground (Enklast)
1. Gå till [OAuth2 Playground](https://developers.google.com/oauthplayground/)
2. Klicka på kugghjulet (Settings) → "Use your own OAuth credentials"
3. Ange din Client ID och Client Secret
4. I "Step 1": Välj "Google Analytics Reporting API v4"
5. Klicka "Authorize APIs"
6. Logga in med ditt Google-konto
7. I "Step 2": Klicka "Exchange authorization code for tokens"
8. Kopiera "Access token"

### Metod 2: curl (För avancerade)
```bash
curl -X POST https://oauth2.googleapis.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "refresh_token=YOUR_REFRESH_TOKEN" \
  -d "grant_type=refresh_token"
```

## Steg 3: Lägg till på Vercel

1. Gå till Vercel Dashboard → Project Settings → Environment Variables
2. Lägg till:
   ```
   GA4_PROPERTY_ID=249591466
   GOOGLE_ACCESS_TOKEN=ya29.a0AfH6SMC...
   ```

## Steg 4: Testa

```bash
# Lokalt
npm run dev
# Kolla http://localhost:3004/api/ga4/metrics?days=28

# På Vercel
# Kolla https://your-app.vercel.app/api/ga4/metrics?days=28
```

## Viktiga noter

- **Access tokens går ut**: De varar bara 1 timme
- **Refresh tokens**: Behövs för att få nya access tokens
- **Behörigheter**: Kontrollera att OAuth2-appen har rätt behörigheter

## Automatisk token refresh (Framtida förbättring)

För produktion bör vi implementera automatisk token refresh:
1. Spara refresh token
2. Automatiskt hämta ny access token när den går ut
3. Använd refresh token istället för access token

## Felsökning

### "Invalid token"
- Token har gått ut (1 timme)
- Felaktig token
- Saknar behörigheter

### "Access denied"
- OAuth2-appen har inte rätt behörigheter
- Användaren har inte tillgång till GA4-propertyn

### "Property not found"
- Felaktig GA4_PROPERTY_ID
- Användaren har inte tillgång till propertyn

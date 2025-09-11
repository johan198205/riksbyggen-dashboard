# AI Insights Setup Guide

## 1. OpenAI API Configuration

För att använda AI-insikter funktionaliteten behöver du en OpenAI API-nyckel.

### Steg 1: Skaffa API-nyckel
1. Gå till [OpenAI Platform](https://platform.openai.com/api-keys)
2. Logga in eller skapa ett konto
3. Skapa en ny API-nyckel

### Steg 2: Lägg till miljövariabel
Skapa en `.env.local` fil i projektets rot och lägg till:

```bash
OPENAI_API_KEY=your_actual_api_key_here
```

### Steg 3: Starta om utvecklingsservern
```bash
npm run dev
```

## 2. Testa funktionaliteten

1. Öppna dashboarden i webbläsaren
2. Klicka på AI-ikonen (hjärna-symbolen) på något av metric-korten
3. Sidebar ska öppnas och visa AI-analys

## 3. Felsökning

### Om du ser "OpenAI API key not configured":
- Kontrollera att `.env.local` filen finns i projektets rot
- Kontrollera att API-nyckeln är korrekt formaterad
- Starta om utvecklingsservern

### Om du ser "Failed to fetch insights: 500":
- Kontrollera att GA4-tjänsten fungerar
- Kontrollera att OpenAI API-nyckeln är giltig
- Kontrollera konsolen för mer detaljerade felmeddelanden

## 4. Funktioner

- **AI-ikoner**: Syns på alla metric-kort (Pageviews, Sessions, Users, Engagement)
- **Sidebar**: Öppnas när du klickar på AI-ikonen
- **Analys**: Visar sammanfattning, anomalier och åtgärdsförslag på svenska
- **Stängning**: Klicka på X-knappen eller tryck Escape

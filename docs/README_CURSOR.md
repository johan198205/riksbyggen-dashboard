# README — Användning i Cursor

## Syfte
Denna mapp innehåller dina grundfiler (MD) för att driva konsekventa och effektiva prompts i Cursor.

## Snabbstart
1. Öppna projektet i Cursor.
2. Lägg till mappen `/packages/prompts` eller denna export i din arbetsyta.
3. Skapa en *Composer Prompt* som alltid inkluderar:
   - SYSTEM.md
   - RULES.md
   - ARCHITECTURE.md
   - STATE.md
   - TEMPLATES.md
4. Klistra in aktuell data (aggregerad json) i en ny fil `DATA_CURRENT.json` och referera den i prompten.
5. Kör dina mallar under `TEMPLATES.md` beroende på behov.

## Tips
- Använd *Inline Chat* för mindre frågor och *Composer* för fulla rapporter.
- Spara *Prompt Snippets* för återkommande körningar.
- Håll STATE.md uppdaterad med modell, temperatur och tröskelvärden.

## Integration med Next.js‑temat
Du laddade upp `nextjs-admin-dashboard-main.zip`. Mappa följande:
- Lägg `packages/prompts/*.md` i ett repo‑subtree.
- Skapa en `lib/ai.ts` som läser md‑filerna och injicerar som system‑prompts.
- Anropa backend‑endpoint `/analyze` för AI‑insikter och cacha resultat i 1h.

# TEMPLATES — Promptmallar för Cursor

## 1) Executive Summary
**Systemkontext:** Ladda SYSTEM, RULES, ARCHITECTURE, STATE.  
**Roll:** Senior growth‑analytiker.  
**Input:** Aggregerad KPI‑json (senaste 30 dagar) + jämförelseperiod.

**Prompt:**
```
Sammanfatta läget för perioden {{range}} jämfört med {{compare_range}}.
- Visa 3–5 bullets (kort och konkreta).
- Markera spikar/dippar enligt RULES.
- Ange vilka kanaler/land/enheter som driver förändring.
- Avsluta med 3 rekommendationer (1 Quick Win, 2 Strategiska) med Varför/Hur.
```

## 2) Kanalprestanda (tabell på svenska)
```
Skapa en tabell över kanalprestanda för {{range}} med kolumner:
Kanal | Sessioner | Konverteringar | CR | Intäkt | Δ% vs föregående period
Kort kommentar under tabellen: 1–2 meningar om största förändringen.
```

## 3) Avvikelser
```
Identifiera avvikelser enligt RULES avvikelse-heuristik.
För varje avvikelse:
- Titel
- Datakälla & datum
- Möjlig orsak (1–2)
- Rekommenderad åtgärd (konkret)
- Konfidens (låg/medel/hög)
```

## 4) Sidor & Innehåll
```
Lista topp 10 sidor efter trafik och topp 10 efter konvertering.
För 3 utvalda sidor: ge förbättringsförslag (rubrik, CTA, internlänkning).
```

## 5) Exporttext till ledning
```
Skriv en sammanfattning på max 120 ord för ledningsgruppen.
Fokusera på trender, risker och 1–2 viktiga beslutspunkter.
```

## 6) Datakvalitet
```
Bedöm datakvaliteten:
- Finns mönster som tyder på tracking-fel?
- Lista vilka kontroller som bör göras i GTM/GA4.
```

## 7) Mappning av events (GA4)
```
Verifiera att följande events och parametrar hämtas och mappas korrekt:
- purchase: value, items[], item_brand, item_category
- begin_checkout: coupon, items[]
- add_to_cart: items[], item_list_name
- session_default_channel_group, source/medium
- deviceCategory, country, city
Flagga saknade eller inkonsekventa fält och föreslå korrigeringar.
```

## 8) KPI‑kort (UI‑copy)
```
Skriv kort, tydlig UI‑copy (svenska) för KPI‑korten Sessions, Users, Pageviews, Conversions, Revenue.
Max 12 ord/kort, undvik jargong.
```


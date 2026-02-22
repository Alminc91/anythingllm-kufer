# 🗺️ AnythingLLM Embed Analytics - Roadmap

## ✅ Phase 1: Conversation ID Tracking & RAG Context Fix (ABGESCHLOSSEN)

**Status:** ✅ Vollständig implementiert & getestet (22.02.2026)

### Implementierte Features:
- ✅ **Conversation ID System** (UUID v4)
  - Widget-getrieben: Neue UUID beim ersten Chat
  - Reset-Funktionalität: Neue UUID bei "Clear Chat"
  - LocalStorage-Persistenz pro Embed

- ✅ **RAG Context Fix** (HAUPTZIEL)
  - Backend nutzt `conversation_id` statt `session_id` für History-Retrieval
  - Alte Nachrichten erscheinen NICHT mehr im neuen Konversations-Context
  - **Problem gelöst:** RAG Context enthält nur noch relevante Nachrichten

- ✅ **Admin-UI: Konversations-Gruppierung**
  - Konversations-Karten statt Flat-Liste
  - "🆕 NEU" Badge für Konversationen <1h
  - Beide Zeitstempel: "Erstellt" (absolut) + "Letzte Nachricht" (relativ)
  - Expandable Details: Alle Nachrichten einer Konversation
  - Workspace-Name angezeigt

- ✅ **Backwards Compatibility**
  - Alte Chats ohne `conversation_id` funktionieren weiter
  - Fallback: `conversation_id = session_id` für Legacy-Daten
  - Migration: 27 bestehende Chats automatisch migriert

### Technische Umsetzung:
- **Backend:** 4 Dateien (Schema, Models, Endpoints, Utils)
- **Frontend:** 4 Dateien (Models, UI, Translations)
- **Widget:** 8 Dateien (Hooks, Services, Components)
- **Database:** Prisma Migration + Index auf `conversation_id`

### Test-Ergebnisse:
- ✅ Alle 19 Features getestet und funktionieren
- ✅ E2E-Test: Widget → Backend → Database → Admin-UI
- ✅ RAG Context verifiziert: Konversationen getrennt
- ✅ UI-Tests: Karten, Badge, Expand, Zeitstempel

---

## 📋 Phase 2: LLM-basierte Analytics (GEPLANT)

**Ziel:** Intelligente Auswertung von Chat-Daten für Support & Business Insights

### 2.1 Häufigste Fragen / Themen-Clustering

**Technologie:** LLM Embeddings + K-Means Clustering

**Features:**
- [ ] Top 10 häufigste Frage-Kategorien
  - Automatisches Clustering aller User-Prompts
  - Kategorie-Namen per LLM generieren
  - Anzahl Fragen pro Kategorie

- [ ] Trend-Analyse
  - Welche Fragen nehmen zu/ab?
  - Neue Frage-Kategorien erkennen
  - Zeitreihen-Diagramm

**Implementierung:**
```javascript
// Pseudocode
const prompts = await getAllUserPrompts(embedId, dateRange);
const embeddings = await getEmbeddings(prompts); // OpenAI/Local
const clusters = kMeansClustering(embeddings, k=10);

// Für jedes Cluster: LLM generiert Kategorie-Namen
const categories = await Promise.all(
  clusters.map(cluster =>
    llm.chat(`Fasse diese Fragen in 2-3 Worten zusammen: ${cluster.samples}`)
  )
);
```

**UI-Komponente:**
```jsx
<TopQuestionsWidget>
  <QuestionCategory
    name="Kontoeröffnung"
    count={45}
    trend="+12%"
    examples={["Wie öffne ich ein Konto?", "Benötigte Dokumente?"]}
  />
  <QuestionCategory name="Öffnungszeiten" count={32} trend="-5%" />
  ...
</TopQuestionsWidget>
```

**Aufwand:** ~2-3 Tage
**Abhängigkeiten:** LLM Embeddings API (bereits vorhanden in AnythingLLM)

---

### 2.2 Sentiment-Analyse pro Konversation

**Technologie:** LLM-basiertes Sentiment (GPT/Local)

**Features:**
- [ ] Sentiment-Score pro Konversation
  - Positiv / Neutral / Negativ
  - Numerischer Score (-1 bis +1)
  - Sentiment-Verlauf über Zeit

- [ ] Sentiment-Trigger erkennen
  - Wann kippt Sentiment von positiv zu negativ?
  - Welche Themen führen zu negativem Sentiment?

- [ ] Alerts für negative Konversationen
  - Email-Benachrichtigung bei stark negativem Sentiment
  - Eskalation an Support-Team

**Implementierung:**
```javascript
// Pro Konversation: Sentiment der letzten User-Nachricht analysieren
const sentiment = await llm.chat(
  `Analysiere das Sentiment dieser Nachricht: "${lastUserPrompt}"

   Antworte im JSON-Format:
   {
     "sentiment": "positiv|neutral|negativ",
     "score": 0.8,  // -1 (sehr negativ) bis +1 (sehr positiv)
     "reason": "Kunde ist zufrieden mit schneller Antwort"
   }`
);

// In Database speichern
await updateConversation(conversationId, {
  sentiment: sentiment.sentiment,
  sentiment_score: sentiment.score,
  sentiment_reason: sentiment.reason
});
```

**UI-Komponente:**
```jsx
<SentimentDashboard>
  <SentimentTrend data={sentimentHistory} />
  <NegativeConversations
    conversations={negativeConvs}
    onEscalate={escalateToSupport}
  />
  <SentimentDistribution positive={65} neutral={25} negative={10} />
</SentimentDashboard>
```

**Aufwand:** ~2 Tage
**Abhängigkeiten:** LLM Chat API

---

### 2.3 Problematische Nachrichten erkennen

**Technologie:** LLM Moderation API + Custom Rules

**Features:**
- [ ] Toxicity-Erkennung
  - Schimpfwörter, Beleidigungen, Bedrohungen
  - Spam, Phishing-Versuche
  - Policy-Verletzungen

- [ ] Automatisches Flagging
  - Problematische Nachrichten in DB markieren
  - Moderations-Queue für Review
  - Auto-Blockierung bei schweren Verstößen

- [ ] Moderation-Dashboard
  - Liste aller geflaggten Nachrichten
  - Review-Workflow (Approve/Reject/Block)
  - Statistiken: Toxicity-Rate, häufigste Kategorien

**Implementierung:**
```javascript
// Bei jeder neuen User-Nachricht: Moderation-Check
const moderation = await openai.moderations.create({
  input: userPrompt
});

if (moderation.results[0].flagged) {
  const categories = moderation.results[0].categories;

  await flagMessage(chatId, {
    flagged: true,
    categories: categories, // hate, harassment, sexual, violence, etc.
    severity: moderation.results[0].category_scores
  });

  // Optional: Auto-Block bei schweren Verstößen
  if (categories.violence || categories.hate) {
    await blockSession(sessionId);
  }
}
```

**UI-Komponente:**
```jsx
<ModerationDashboard>
  <FlaggedMessages
    messages={flaggedList}
    onReview={(msgId, action) => reviewMessage(msgId, action)}
  />
  <ToxicityStats
    totalFlagged={156}
    byCategory={{ hate: 12, spam: 98, harassment: 46 }}
  />
</ModerationDashboard>
```

**Aufwand:** ~3 Tage
**Abhängigkeiten:** OpenAI Moderation API (oder Alternative: Perspective API)

---

### Phase 2 Zusammenfassung

**Gesamtaufwand:** ~7-10 Tage
**Priorisierung:**
1. **High:** Häufigste Fragen (Top 10) → Direkter Business Value
2. **Medium:** Sentiment-Analyse → Support-Qualität verbessern
3. **Low:** Problematische Nachrichten → Nur bei Bedarf (z.B. öffentliche Widgets)

**Neue Database-Felder:**
```prisma
model embed_chats {
  // ... existing fields ...
  sentiment          String?   // "positiv", "neutral", "negativ"
  sentiment_score    Float?    // -1 bis +1
  sentiment_reason   String?   // LLM-Begründung
  flagged            Boolean   @default(false)
  flag_categories    Json?     // Moderation-Kategorien
  flag_severity      Json?     // Severity-Scores
  reviewed_at        DateTime?
  reviewed_by        Int?
}
```

---

## 🔮 Phase 3: Advanced Features (ZUKUNFT)

**Langfristige Vision für Enterprise-Features**

### 3.1 Automatische FAQ-Generierung
- LLM analysiert häufigste Fragen + beste Antworten
- Generiert automatisch FAQ-Dokumente
- Vorschläge für Knowledge-Base-Artikel

### 3.2 Response-Quality-Scoring
- LLM bewertet Antwort-Qualität (0-10)
- Erkennt unvollständige/ungenaue Antworten
- Vorschläge für Verbesserungen im RAG-System

### 3.3 Konversations-Zusammenfassungen
- LLM generiert Zusammenfassung pro Konversation
- "User wollte Kontoeröffnung, wurde erfolgreich weitergeleitet"
- Automatisches Tagging (Intent, Outcome, Satisfaction)

### 3.4 Predictive Analytics
- Vorhersage: Wird User konvertieren? (Lead Scoring)
- Churn-Risk-Erkennung (negatives Sentiment → Abwanderung?)
- Beste Zeitpunkte für Proaktive Kontaktaufnahme

### 3.5 Multi-Language Support
- Automatische Sprach-Erkennung
- Übersetzung für Analytics (alle Sprachen → DE/EN)
- Sentiment-Analyse sprachübergreifend

### 3.6 Integration mit externen Tools
- Slack-Benachrichtigungen bei kritischen Konversationen
- Zapier/Make.com Webhooks für Custom Workflows
- CRM-Integration (HubSpot, Salesforce)

---

## 📊 Roadmap Timeline

```
Q1 2026:
├─ ✅ Phase 1: Conversation ID (DONE - Feb 2026)
└─ 📋 Phase 2.1: Häufigste Fragen (geplant - März 2026)

Q2 2026:
├─ 📋 Phase 2.2: Sentiment-Analyse (geplant - April 2026)
└─ 📋 Phase 2.3: Moderation (optional - Mai 2026)

Q3/Q4 2026:
└─ 🔮 Phase 3: Evaluierung basierend auf User-Feedback
```

---

## 🎯 Success Metrics

**Phase 1 (aktuell):**
- ✅ RAG Context Accuracy: 100% (nur relevante Nachrichten)
- ✅ Konversations-Gruppierung: Funktioniert
- ✅ User Experience: "🆕 NEU" Badge + Zeitstempel

**Phase 2 (Ziel):**
- Häufigste Fragen: Top 10 identifiziert → FAQ erstellen
- Sentiment: 80%+ Accuracy bei Positiv/Negativ-Erkennung
- Support-Effizienz: Negative Konversationen werden priorisiert

**Phase 3 (Vision):**
- FAQ-Automation: 50% weniger Support-Tickets
- Lead Conversion: +15% durch proaktive Kontaktaufnahme
- Churn Prevention: -20% Abwanderung durch frühzeitige Intervention

---

## 🤝 Contribution Guidelines

**Phase 2 beitragen:**
1. Issue erstellen mit Feature-Beschreibung
2. Design-Doc für größere Features (>3 Tage Aufwand)
3. Tests schreiben (E2E + Unit)
4. UI/UX mit Screenshots dokumentieren

**Technologie-Stack:**
- LLM: OpenAI GPT-4 oder Local (Ollama)
- Embeddings: OpenAI `text-embedding-3-small` oder Local
- Database: Prisma + SQLite (Production: PostgreSQL)
- Frontend: React + TailwindCSS

---

## 📝 Changelog

### 2026-02-22 - Phase 1 Release
- ✅ Conversation ID Tracking implementiert
- ✅ RAG Context Fix (conversation_id statt session_id)
- ✅ Admin-UI: Konversations-Gruppierung mit "🆕 NEU" Badge
- ✅ Widget: UUID v4 Generation + Reset-Funktionalität
- ✅ Database Migration: 27 Chats migriert
- ✅ Alle Tests bestanden (19/19 Features)

### 2026-02-22 - Roadmap erstellt
- 📋 Phase 2 geplant: LLM-basierte Analytics
- 🔮 Phase 3 Vision: Advanced Enterprise Features

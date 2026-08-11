# BACKEND_REQUIREMENTS.md — MigraineGuardian Backend Specification

> **Document Version**: 2.0.0  
> **Target Platform**: MigraineGuardian (Calm Digital Health & Predictive Migraine Wellness)  
> **Status**: Final Architecture Specification (Firebase + Firestore + Node/Express + FastAPI + MongoDB Atlas)  

---

## 1. Executive Summary & System Architecture

MigraineGuardian is a serene, clinical-grade digital wellness platform designed to track autonomic triggers, calculate Perceived Stress Scale (PSS-10) evaluations, predict daily migraine vulnerability, and provide grounded wellness guidance.

The production backend architecture separates concerns into a **Node.js/Express API Gateway**, **Firebase Services**, a **MongoDB Atlas Vector Store**, and a **Python/FastAPI ML Engine**.

```
+-----------------------------------------------------------------------------------+
|                            React 18 Frontend (SPA)                                |
+-----------------------------------------------------------------------------------+
                                         |
                                         | (REST API / Firebase Bearer ID Tokens)
                                         v
+-----------------------------------------------------------------------------------+
|                        Node.js + Express API Gateway                              |
|                    (Authentication & API Orchestration Layer)                     |
+-----------------------------------------------------------------------------------+
         |                                |                                |
         | (Firebase Admin SDK)           | (HTTP / REST)                  | (MongoDB Driver)
         v                                v                                v
+-------------------+            +-------------------+            +-------------------+
| Firebase Auth &   |            | Python + FastAPI  |            | MongoDB Atlas     |
| Cloud Firestore   |            | ML/XAI Engine     |            | Vector Store      |
|                   |            |                   |            |                   |
| - Identity        |            | - Vulnerability   |            | - RAG Knowledge   |
| - User Profiles   |            |   Scoring         |            |   Documents       |
| - Daily Checkins  |            | - SHAP Feature    |            | - Clinical        |
| - PSS Assessments |            |   Attribution     |            |   Embeddings      |
| - Risk Forecasts  |            | - Trend Inference |            | - Chat Context    |
+-------------------+            +-------------------+            +-------------------+
```

### Core Service Responsibilities Matrix

| Service / Subsystem | Technology | Primary Responsibilities |
| :--- | :--- | :--- |
| **Authentication Service** | Firebase Authentication | User signup, login, password resets, token issuance, and JWT ID token verification. |
| **Application Database** | Cloud Firestore | Operational application documents, user health profiles, daily micro-checkins, migraine attack logs, PSS evaluation histories, risk forecasts, and user settings. |
| **API Orchestrator Layer** | Node.js + Express | Verifies Firebase ID Tokens, executes business logic, handles CRUD endpoints, calls the FastAPI ML service, queries MongoDB Atlas RAG vector store, and formats responses for the frontend. |
| **ML & XAI Engine** | Python + FastAPI | Statistical risk score calculation (0–100 probability), SHAP feature attribution (explaining *why* risk is elevated), and generating structured focus recommendations. |
| **RAG Vector Store** | MongoDB Atlas | Stores clinical knowledge documents, medical literature chunks, vector embeddings, and multi-turn chat history for the Guardian AI assistant. |

---

## 2. Comprehensive Frontend Audit & Dependency Map

*(Preserved from Frontend Audit analysis of `src/` files)*

### 2.1 Mock Datasets Identified (`src/data/`)

| Mock File | Frontend Entity / Contract | Data Fields & Schemas Identified |
| :--- | :--- | :--- |
| `mockUser.js` | User Profile & Baseline | `id`, `name`, `email`, `avatar`, `initials`, `joinedDate`, `diagnosis`, `baselineTriggers[]`, `currentRiskScore`, `riskCategory`, `lastCheckinTime`, `consecutiveTrackingDays`, `pssScore{score, category, lastTaken}`, `emergencyProtocol{prescribedMedication, secondaryAction, emergencyContact}` |
| `mockDailyLogs.js` | 30-Day Micro-Checkins | `day_number`, `date`, `weekday`, `label`, `sleep_hours`, `sleep_quality` (1-5), `daily_stress` (0-10), `mood` (1-5), `screen_time`, `hydration`, `meal_skipped`, `caffeine`, `exercise`, `migraine_occurrence` (boolean), `migraine_severity` (0-10), `migraine_duration`, `symptoms[]`, `risk_probability` (0-100) |
| `mockPredictions.js` | Today's Risk Estimate | `score`, `level`, `title`, `subtext`, `headline`, `summary`, `elevatedReasonHeading`, `elevatedFactors[{factor, value, comparison, description, statusType}]`, `focusAreas[{title, description}]`, `disclaimer` |
| `mockAnalytics.js` | Longitudinal Analytics | Timeframes (`7days`, `30days`, `90days`), `summary{totalLoggedDays, migraineDaysLogged, avgSeverity, primaryTrigger}`, `riskTrend[{day, score, level}]`, `factorDistributions[{factor, contributionPercent, status}]`, `attackFrequency[{period, count}]`, `calendarMatrix[{date, day, status, severity}]` |
| `mockInsights.js` | Discovered Correlations | `weeklySummary`, `discoveredCorrelations[{trigger, likelihoodIncrease, confidence, description}]`, `noticedPatterns[{title, text, metrics[]}]`, `nextWeekFocus[{title, description, status}]` |
| `mockReports.js` | Clinical Summaries | `patientSummary`, `clinicalMetrics{totalEpisodes, avgDuration, peakSeverity, pssBaseline}`, `triggerBreakdown`, `medicationEfficacy`, `neurologistNotes` |
| `mockChat.js` | Guardian AI Context | `conversationHistory[{id, sender, text, time, dataPoints[], recommendation, sources[], safetyNote}]`, `suggestedQuestions[]` |
| `mockOverview.js` | Dashboard Aggregates | Baseline risk score, tracking streak counter, 5-day foresight forecast array |

---

### 2.2 `localStorage` Keys Audit (`src/services/storageService.js`)

All storage keys use the prefix `mg_v1_`:

| Storage Key | Current Purpose | Target Production Destination |
| :--- | :--- | :--- |
| `mg_v1_migraineguardian_user` | Cached user profile | Cloud Firestore (`users/{userId}`) |
| `mg_v1_migraineguardian_authenticated` | Local auth flag | Firebase Authentication ID Token |
| `mg_v1_migraineguardian_accounts` | Mock user registry | Firebase Authentication Identity Pool |
| `mg_v1_daily_checkin_today` | Today's check-in draft | Cloud Firestore (`users/{userId}/daily_checkins/{date}`) |
| `mg_v1_migraineguardian_daily_logs` | Historical checkins array | Cloud Firestore (`users/{userId}/daily_checkins`) |
| `mg_v1_onboarding_draft` | 3-step setup selections | Cloud Firestore (`users/{userId}`) |
| `mg_v1_pss_score_latest` | Latest PSS-10 score | Cloud Firestore (`users/{userId}/pss_assessments`) |

---

### 2.3 Frontend Service Abstraction (`src/services/`)

| Frontend Service File | Current Functions | Target Backend Endpoint |
| :--- | :--- | :--- |
| `authService.js` | `getCurrentUser()`, `login()`, `signup()`, `logout()`, `updateUserProfile()` | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/user/profile`, `PATCH /api/user/profile` |
| `trackingService.js` | `getDailyLogs()`, `getTodayLog()`, `saveDailyCheckin()`, `getTrackingFactors()` | `GET /api/checkins`, `POST /api/checkins/today` |
| `predictionService.js` | `getTodayPrediction()`, `getRiskTrend()`, `getElevatedFactors()` | `GET /api/predictions/today` |
| `analyticsService.js` | `getAnalyticsData()`, `getCalendarDays()`, `getSummaryMetrics()` | `GET /api/analytics/overview` |
| `insightsService.js` | `getWeeklyInsights()`, `getNoticedPatterns()`, `getNextWeekFocus()` | `GET /api/insights/weekly` |
| `reportService.js` | `getReport()`, `generatePdfReport()`, `generateShareLink()` | `GET /api/reports/summary`, `POST /api/reports/export/pdf` |
| `chatService.js` | `getInitialChatContext()`, `sendMessage()` | `POST /api/chat/message` |
| `mockApiService.js` | `getUserProfile()`, `getOverviewMetrics()`, `submitCheckin()` | Express REST Router |

---

### 2.4 Page-by-Page Data Audit

| Page Component | Route Path | Form Inputs & Captured Data | Required Output Data from Backend |
| :--- | :--- | :--- | :--- |
| `LandingPage.jsx` | `/` | None | System status metadata & general platform features |
| `HowItWorksPage.jsx` | `/how-it-works` | None | PSS clinical framework explanation |
| `LoginPage.jsx` | `/login` | `email`, `password`, `rememberMe` | Firebase Auth ID Token + User Profile document |
| `SignupPage.jsx` | `/signup` | `fullName`, `email`, `password`, `confirmPassword`, `consentAgreed` | Created Firebase user record + Initialized Firestore profile |
| `OnboardingPage.jsx` | `/onboarding` | `name`, `age`, `gender`, `hasMigraines`, `frequency`, `severity`, `duration`, `usesMedication`, `selectedFactors[]` | Updated `users/{userId}` profile document |
| `PssAssessmentPage.jsx` | `/pss-assessment` | 10 PSS questionnaire item radio selections (scale 0-4) | Calculated PSS score (0-40), category, timestamped record in `pss_assessments` |
| `DashboardPage.jsx` | `/dashboard` | Quick check-in toggle | Today's risk score, 5-day risk foresight array, streak count, latest check-in summary |
| `DailyCheckinPage.jsx` | `/daily-checkin` | `sleep_hours`, `sleep_quality`, `daily_stress`, `mood`, `screen_time`, `hydration`, `meal_skipped`, `caffeine`, `exercise`, `migraine_occurrence`, `migraine_severity`, `migraine_duration`, `symptoms[]` | Saved document in `daily_checkins`, newly re-calculated ML risk forecast |
| `RiskAnalysisPage.jsx` | `/risk-analysis` | Factor filter toggles | Weather/barometric sensitivity model & ML elevated factor breakdown |
| `InsightsPage.jsx` | `/insights` | Timeframe toggle (`7days`, `30days`) | Discovered correlation matrix & next week focus guidance |
| `AnalyticsPage.jsx` | `/analytics` | Timeframe selector | Time-series trend data, attack frequency, 30-day calendar matrix |
| `ReportsPage.jsx` | `/reports` | Report timeframe selector, export format button | Physician report metrics payload & generated PDF report link |
| `ChatPage.jsx` | `/chat` | Chat input prompt string (`query`) | Grounded RAG assistant response, cited sources, correlated user log data points |
| `ProfilePage.jsx` | `/profile` | `name`, `age`, `gender`, active tracking factors list | Editable profile document, historical PSS scores, emergency protocol |
| `SettingsPage.jsx` | `/settings` | Quiet hours, high contrast, notifications, clear data request | Saved user settings document |

---

## 3. Storage & Data Models Specification

### 3.1 Firebase Authentication Data
Firebase Auth stores identity data securely in managed user accounts:
- **`uid`**: String (Unique Firebase User Identifier)
- **`email`**: String
- **`displayName`**: String
- **`emailVerified`**: Boolean
- **`createdAt`**: Timestamp

---

### 3.2 Cloud Firestore Collection & Document Structure

The relational database design has been converted into a hierarchical document structure:

```
cloud-firestore/
├── users/ (Collection)
│   └── {userId}/ (Document: Main User Profile & Settings)
│       │
│       ├── daily_checkins/ (Subcollection)
│       │   └── {checkinId}/ (Document: e.g. "2024-10-30")
│       │       └── migraine_episodes/ (Subcollection if episode occurred)
│       │           └── {episodeId}/ (Document)
│       │
│       ├── pss_assessments/ (Subcollection)
│       │   └── {assessmentId}/ (Document)
│       │
│       ├── risk_forecasts/ (Subcollection)
│       │   └── {forecastId}/ (Document: e.g. "2024-10-30")
│       │
│       └── settings/ (Subcollection)
│           └── preferences/ (Document)
```

#### Collection 1: `users`
- **Document Path**: `users/{userId}` (where `{userId}` matches `request.auth.uid`)
- **Document Fields**:
  ```json
  {
    "userId": "string (Firebase UID)",
    "name": "string (e.g. 'Sakshi')",
    "email": "string",
    "initials": "string (e.g. 'SA')",
    "joinedDate": "timestamp",
    "age": "number (optional, e.g. 32)",
    "gender": "string (optional, e.g. 'Female')",
    "diagnosis": "string (e.g. 'Migraine with sensory aura')",
    "hasMigraines": "string ('Yes' | 'No' | 'Not sure')",
    "frequency": "string (e.g. '1–3 times a month')",
    "severity": "number (0-10 baseline)",
    "duration": "string (e.g. '4–12 hours')",
    "usesMedication": "string ('Yes' | 'No' | 'Prefer not to say')",
    "baselineTriggers": ["array of strings"],
    "selectedFactors": ["array of strings: 'Sleep', 'Stress', 'Screen time', 'Hydration', 'Meals'"],
    "emergencyProtocol": {
      "prescribedMedication": "string",
      "secondaryAction": "string",
      "emergencyContact": "string"
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```

#### Subcollection 2: `users/{userId}/daily_checkins`
- **Document Path**: `users/{userId}/daily_checkins/{checkinId}` (Document ID formatted as `YYYY-MM-DD`, e.g., `2024-10-30`)
- **Document Fields**:
  ```json
  {
    "checkinId": "string (e.g. '2024-10-30')",
    "date": "string (YYYY-MM-DD)",
    "dayNumber": "number (1-30)",
    "sleep_hours": "number (e.g. 5.8)",
    "sleep_quality": "number (1-5)",
    "daily_stress": "number (0-10)",
    "mood": "number (1-5)",
    "screen_time": "number (e.g. 8.2)",
    "hydration": "number (e.g. 1.5)",
    "meal_skipped": "string ('No' | 'Breakfast' | 'Lunch' | 'Dinner' | 'More than one')",
    "caffeine": "string (e.g. '2 cups')",
    "exercise": "string (e.g. 'Light walk / gentle stretch')",
    "migraine_occurrence": "boolean",
    "createdAt": "timestamp"
  }
  ```

#### Subcollection 3: `users/{userId}/daily_checkins/{checkinId}/migraine_episodes`
- **Document Path**: `users/{userId}/daily_checkins/{checkinId}/migraine_episodes/{episodeId}`
- **Document Fields**:
  ```json
  {
    "episodeId": "string (auto-generated)",
    "checkinDate": "string (YYYY-MM-DD)",
    "severity": "number (0-10)",
    "duration": "string (e.g. '4 hours')",
    "symptoms": ["array of strings: 'Light sensitivity', 'Nausea', 'Aura'"],
    "medicationTaken": "string (optional)",
    "reliefRating": "number (1-5, optional)",
    "createdAt": "timestamp"
  }
  ```

#### Subcollection 4: `users/{userId}/pss_assessments`
- **Document Path**: `users/{userId}/pss_assessments/{assessmentId}`
- **Document Fields**:
  ```json
  {
    "assessmentId": "string (auto-generated)",
    "score": "number (0-40)",
    "category": "string ('Low Perceived Stress' | 'Moderate Stress Load' | 'Elevated Perceived Stress')",
    "answers": {
      "q1": 2, "q2": 3, "q3": 3, "q4": 1, "q5": 2,
      "q6": 3, "q7": 1, "q8": 2, "q9": 2, "q10": 2
    },
    "completedAt": "timestamp"
  }
  ```

#### Subcollection 5: `users/{userId}/risk_forecasts`
- **Document Path**: `users/{userId}/risk_forecasts/{date}` (Document ID matches `YYYY-MM-DD`)
- **Document Fields**:
  ```json
  {
    "forecastDate": "string (YYYY-MM-DD)",
    "score": "number (0-100 probability)",
    "level": "string ('Low' | 'Moderate' | 'High')",
    "headline": "string (e.g. 'Elevated Sensitivity Window')",
    "summary": "string",
    "elevatedFactors": [
      {
        "factor": "string (e.g. 'Sleep')",
        "value": "string (e.g. '5.8 h')",
        "comparison": "string (e.g. '1.2 h below baseline')",
        "description": "string",
        "statusType": "string ('alert' | 'warning' | 'stable')"
      }
    ],
    "focusAreas": [
      {
        "title": "string (e.g. 'Sleep consistency')",
        "description": "string"
      }
    ],
    "disclaimer": "string",
    "createdAt": "timestamp"
  }
  ```

#### Subcollection 6: `users/{userId}/settings`
- **Document Path**: `users/{userId}/settings/preferences`
- **Document Fields**:
  ```json
  {
    "highContrast": "boolean",
    "quietHoursStart": "string (e.g. '22:00')",
    "quietHoursEnd": "string (e.g. '07:00')",
    "notificationsEnabled": "boolean",
    "updatedAt": "timestamp"
  }
  ```

---

### Firestore Composite Indexes & Security Rules

#### Required Firestore Indexes
1. Subcollection `daily_checkins`: Composite Index on `date` DESC.
2. Subcollection `pss_assessments`: Composite Index on `completedAt` DESC.
3. Subcollection `risk_forecasts`: Composite Index on `forecastDate` DESC.

#### Firestore Security Rules Guidelines
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check authentication
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to verify account ownership
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Rules for user profile & subcollections
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /{allSubcollections=**} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

---

### 3.3 MongoDB Atlas (RAG Database & Vector Store)

MongoDB Atlas stores knowledge base embeddings and AI chat conversation contexts for the Guardian AI assistant.

#### Collection 1: `knowledge_documents`
- **Collection Name**: `knowledge_documents`
- **Document Schema**:
  ```json
  {
    "_id": "ObjectId",
    "document_id": "string (e.g. 'doc_amf_sleep_2024')",
    "title": "string (e.g. 'Sleep Hygiene and Migraine Vulnerability')",
    "source_name": "string (e.g. 'American Migraine Foundation')",
    "category": "string ('Sleep' | 'Hydration' | 'Stress' | 'Sensory')",
    "content_chunk": "string (Full text chunk used for RAG generation)",
    "embedding_vector": "[Array of 1536 floats - OpenAI / HuggingFace Embedding]",
    "metadata": {
      "author": "string",
      "publication_year": 2023,
      "clinical_tier": "evidence-based"
    },
    "created_at": "ISODate"
  }
  ```
- **MongoDB Atlas Vector Search Index Specification**:
  ```json
  {
    "fields": [
      {
        "type": "vector",
        "path": "embedding_vector",
        "numDimensions": 1536,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "category"
      }
    ]
  }
  ```

#### Collection 2: `chat_sessions`
- **Collection Name**: `chat_sessions`
- **Document Schema**:
  ```json
  {
    "_id": "ObjectId",
    "user_id": "string (Firebase UID)",
    "session_id": "string",
    "messages": [
      {
        "message_id": "string",
        "sender": "string ('user' | 'assistant')",
        "text": "string",
        "timestamp": "ISODate",
        "dataPoints": [
          { "label": "string", "value": "string", "note": "string" }
        ],
        "recommendation": "string",
        "sources": ["array of strings"],
        "safetyNote": "string"
      }
    ],
    "updated_at": "ISODate"
  }
  ```

---

### 3.4 Python + FastAPI (ML & XAI Engine Responsibilities)

The FastAPI service operates as a stateless machine learning inference server.

- **Primary Role**: Processes historical lifestyle vectors and computes risk probability scores and Explainable AI (XAI) attributions.
- **Internal ML Pipeline**:
  1. **Inference Pipeline**: Receives 14-day history vectors + current check-in metrics + recent PSS score. Runs XGBoost / Logistic Regression classification model to compute risk score (0-100).
  2. **XAI Explainer Module**: Applies SHAP (SHapley Additive exPlanations) to calculate exact contribution percentages for elevated factors (e.g., `Sleep duration contribution: +28%`, `Stress contribution: +35%`).
  3. **Recommendation Engine**: Generates targeted, non-alarmist micro-reset focus areas based on identified risk drivers.

- **Endpoint Contract (`POST /predict`)**:
  - **Input Payload**:
    ```json
    {
      "user_id": "usr_84719",
      "latest_log": {
        "sleep_hours": 5.8,
        "sleep_quality": 2,
        "daily_stress": 8,
        "screen_time": 8.2,
        "hydration": 1.5
      },
      "baseline_stats": {
        "avg_sleep": 7.6,
        "avg_stress": 4.0,
        "pss_score": 14
      },
      "recent_episodes_count_7d": 2
    }
    ```
  - **Output Payload**: Matches `mockPredictions.js` schema (`score`, `level`, `elevatedFactors[]`, `focusAreas[]`).

---

## 4. REST API Endpoint Specifications (Node/Express Gateway)

All API endpoints are hosted by the **Node.js/Express** backend. Requests require a Bearer Header: `Authorization: Bearer <Firebase_ID_Token>`.

### 4.1 Auth & User Profile Routes

#### `POST /api/auth/register`
- **Orchestration**: Calls Firebase Auth Admin to create a user account, then initializes the `users/{userId}` document in Cloud Firestore.

#### `POST /api/auth/login`
- **Orchestration**: Verifies Firebase Auth ID Token sent from the frontend and fetches `users/{userId}` profile data from Cloud Firestore.

#### `GET /api/user/profile` & `PATCH /api/user/profile`
- **Orchestration**: Reads or updates the authenticated user's `users/{userId}` document in Cloud Firestore.

---

### 4.2 Check-in & Tracking Routes

#### `POST /api/checkins/today`
- **Orchestration**:
  1. Validates check-in payload.
  2. Writes check-in entry to Firestore (`users/{userId}/daily_checkins/{date}`).
  3. If `migraine_occurrence === true`, writes episode details to `migraine_episodes` subcollection.
  4. Calls FastAPI ML Service (`POST /predict`) to re-evaluate today's risk score.
  5. Writes generated prediction to Firestore (`users/{userId}/risk_forecasts/{date}`).
  6. Returns response to frontend.

#### `GET /api/checkins/history?limit=30`
- **Orchestration**: Queries Firestore `users/{userId}/daily_checkins` subcollection ordered by `date` DESC.

---

### 4.3 PSS Assessment Routes

#### `POST /api/pss/submit`
- **Orchestration**: Calculates total score (0-40), categorizes stress level (`Low`, `Moderate`, `Elevated`), and writes document to `users/{userId}/pss_assessments`.

---

### 4.4 Risk Forecast & Analytics Routes

#### `GET /api/predictions/today`
- **Orchestration**: Fetches today's forecast document from `users/{userId}/risk_forecasts/{date}`.

#### `GET /api/analytics/overview?timeframe=7days`
- **Orchestration**: Aggregates check-in time series from Firestore to compute summary metrics, risk trends, and attack frequency.

---

### 4.5 Guardian AI Chat Routes

#### `POST /api/chat/message`
- **Orchestration**:
  1. Receives user query text.
  2. Fetches user's latest 7-day risk metrics from Cloud Firestore to build personal health context.
  3. Converts query to vector embedding and queries **MongoDB Atlas Vector Search** for top-K clinical knowledge chunks.
  4. Combines user metrics + RAG clinical context + prompt into LLM call.
  5. Appends user message and assistant reply to MongoDB Atlas `chat_sessions` collection.
  6. Returns response payload matching `chatService.js`.

---

## 5. Security & Privacy Best Practices

*(Note: In accordance with project directives, formal claims of HIPAA or GDPR certification are omitted for this MVP specification. The following security and privacy best practices are to be enforced during implementation.)*

1. **Authentication Security**:
   - Authentication is handled by Firebase Auth.
   - Node.js/Express API Gateway validates Firebase Bearer ID Tokens on every protected endpoint using `firebase-admin.auth().verifyIdToken()`.
2. **Access Control & Data Isolation**:
   - Firestore Security Rules restrict document access exclusively to the authenticated owner (`request.auth.uid == userId`).
   - Node/Express queries filter all database operations strictly by the verified `req.user.uid`.
3. **Data Protection & Storage Rules**:
   - Data in transit is secured using HTTPS / TLS 1.3 encryption across all client-to-API and server-to-server microservice communication.
   - Cloud Firestore and MongoDB Atlas data is encrypted at rest using managed AES-256 keys.
4. **Third-Party Telemetry Exclusion**:
   - No external advertising pixels, third-party user trackers, or data-monetization SDKs are included in any layer of the architecture.

---

## 6. Recommended Project Directory Structure

Below is the project directory structure separating the codebase into `frontend/`, `backend/`, and `ml-service/`:

```
Migraine/
├── frontend/                     # Existing React 18 + Vite SPA (Unmodified)
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── data/                 # Current mock datasets
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/             # Frontend HTTP clients
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                      # Node.js + Express API Layer & Orchestrator
│   ├── src/
│   │   ├── config/
│   │   │   ├── firebaseAdmin.js   # Firebase Admin SDK initialization
│   │   │   ├── mongoDb.js         # MongoDB Atlas driver connection
│   │   │   └── fastApiClient.js   # HTTP client for Python FastAPI service
│   │   ├── middleware/
│   │   │   ├── verifyFirebaseToken.js # Auth verification middleware
│   │   │   └── errorHandler.js    # Global error handler
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── checkinController.js
│   │   │   ├── pssController.js
│   │   │   ├── predictionController.js
│   │   │   ├── analyticsController.js
│   │   │   ├── reportController.js
│   │   │   └── chatController.js
│   │   ├── services/
│   │   │   ├── firestoreService.js # Cloud Firestore operations
│   │   │   ├── ragVectorService.js # MongoDB Atlas vector search queries
│   │   │   └── mlInferenceService.js # ML service invocation wrapper
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── checkinRoutes.js
│   │   │   ├── pssRoutes.js
│   │   │   ├── predictionRoutes.js
│   │   │   ├── analyticsRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   └── chatRoutes.js
│   │   └── app.js                # Express app entrypoint
│   ├── package.json
│   └── .env.example
│
└── ml-service/                   # Python + FastAPI ML & XAI Engine
    ├── app/
    │   ├── api/
    │   │   ├── predict.py        # ML Risk prediction endpoint
    │   │   └── explain.py        # SHAP/XAI attribution endpoint
    │   ├── core/
    │   │   └── config.py
    │   ├── models/               # Serialized ML model artifacts (.pkl / .joblib)
    │   │   ├── risk_model.joblib
    │   │   └── scaler.joblib
    │   ├── services/
    │   │   ├── feature_engineering.py
    │   │   ├── risk_calculator.py
    │   │   └── shap_explainer.py
    │   └── main.py               # FastAPI application instance
    ├── requirements.txt
    └── Dockerfile
```

---

## 7. Next Steps & Implementation Roadmap

1. **Firebase Project Setup**: Configure Firebase Authentication (Email/Password) and provision Cloud Firestore instance.
2. **MongoDB Atlas Vector Search Setup**: Initialize `knowledge_documents` collection and build vector index.
3. **Backend Service Development**: Implement Node.js/Express API Gateway with Firebase ID token verification middleware.
4. **FastAPI ML Service Development**: Package risk calculation algorithms and SHAP feature explainer into FastAPI endpoints.
5. **Frontend Service Connector Update**: Update frontend files in `src/services/` to replace local storage calls with API client requests pointing to the Node.js Express server.

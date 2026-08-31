# Walkthrough — AI Routing with Image & Location Analysis

## What was built

The full citizen → AI → department routing pipeline from your diagram is now implemented end-to-end:

```
CITIZEN → Upload Complaint (📷 Image + 📍 Location)
     ↓
AI/ML ENGINE (Image Analysis + Location Analysis)
     ↓
AI Decision Layer → Description, Category, Severity
     ↓
Department → Automatic Assignment → Department Staff
```

---

## Changes made

### 1. Python ML Microservice

#### [model.py](file:///z:/WebApp/civic/python-ml-service/model.py)
- **Image Analysis** (`analyze_image`): Downloads the first uploaded image via `urllib`, processes it with `PIL` and `OpenCV`:
  - **Luminance** — average pixel brightness (detects dark/night conditions)
  - **Edge Density** — Canny edge detection + Laplacian variance (detects surface damage, cracks, debris)
  - **HSV Color Distribution** — gray/asphalt tones, green/vegetation, blue/water percentages
- **Location Analysis** (`analyze_location`): Parses address, ward, landmark for:
  - Sensitive zone detection (schools, hospitals → elevated risk score)
  - Traffic infrastructure detection (highways, bridges → elevated risk score)
  - Recreational/water body zone tagging
- **AI Decision Layer** in `analyze()`:
  - Merges text classification (TF-IDF + MultinomialNB), visual features, and location risk into a weighted severity score
  - Generates a markdown description summarising all findings
- Extended training data with additional examples per category

#### [main.py](file:///z:/WebApp/civic/python-ml-service/main.py)
- `ComplaintRequest` now accepts `images: list` and `location: dict`
- `AnalysisResponse` now includes `description: str`
- `/analyze` endpoint passes all fields to the analyzer

### 2. Express Backend

#### [Complaint.js](file:///z:/WebApp/civic/backend/models/Complaint.js)
- Added `description: String` to the `aiAnalysis` embedded schema

#### [aiRoutingService.js](file:///z:/WebApp/civic/backend/services/aiRoutingService.js)
- `analyzeComplaint` now forwards `images` array to the Python service
- Error-path fallback now includes a markdown description explaining the routing exception

### 3. React Frontend

#### [ComplaintDetails.jsx](file:///z:/WebApp/civic/frontend/src/pages/ComplaintDetails.jsx)
- Added `renderMarkdown` / `parseInline` helpers for safe inline markdown rendering (bold, code, italic, headers, lists)
- New **AI Report Card** panel with gradient background and green accent border, rendering the full AI Decision Layer output

---

## Verification results

| Check | Result |
|---|---|
| `model.py` import + analyzer init | ✅ Pass |
| Test 1: Road Damage + Hospital location → `Critical` severity | ✅ Pass |
| Test 2: Broken Streetlight + image download + analysis | ✅ Pass |
| FastAPI `main.py` module loads cleanly | ✅ Pass |
| Frontend production build (`vite build`) | ✅ Pass (exit 0, zero errors) |

---

## How to test the full flow

1. Start all three services: `npm run dev` (root workspace runs backend + frontend + ML service concurrently)
2. Register/login as a citizen
3. Navigate to **Report a civic issue** → fill in title, description, category, location, and upload an image
4. Submit the complaint
5. Open the complaint details page → scroll to the **AI Analysis** section to see the full AI Decision Layer report card

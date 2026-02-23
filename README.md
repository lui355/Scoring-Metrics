# RFP Fit Checker (HerreraDesigns)

A single-page web app that walks through RFP qualification **one question at a time** and returns a recommendation:
- **BID**
- **CONDITIONAL BID**
- **DECLINE**

## Features
- Step-by-step wizard with progress (`Step X of Y`)
- Back navigation and **Save & Exit**
- Hard Filter early-stop flow (instant decline)
- Weighted Fit Score (0-100)
- Effort-sensitive thresholds (Heavy effort adds +10 threshold)
- Strategic Override path for low scores
- Friction Forecast capture
- Final summary with top reasons, weak spots, risks, and next action
- Local persistence in `localStorage`
- Record export as JSON and CSV

## Run locally
No build tools required.

### Option 1: Python static server
```bash
python -m http.server 4173
```
Then open: `http://localhost:4173`

### Option 2: Direct file open
Open `index.html` in a browser.

## Data stored per record
Each saved evaluation includes:
- timestamp
- client/org name
- project name
- answers
- hard filter status
- category scores
- total score
- proposal effort
- recommendation
- friction forecast
- notes

## Notes
- Running score is intentionally hidden until the result screen.
- Hard filter detection immediately shows decline results.
- Export files are generated client-side.

# Problem Radar MVP - Setup & Deployment Guide

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API Keys:
  - **Anthropic Claude API** (get from [console.anthropic.com](https://console.anthropic.com))
  - **Reddit**: Optional for MVP (uses public API)

---

## Phase 1: Backend Setup

### 1. Initialize Backend

```bash
# Create backend directory
mkdir -p problem-radar/backend
cd problem-radar/backend

# Copy backend files
# - backend-package.json → package.json
# - backend-.env.example → .env
# - backend-schema.sql → db/schema.sql
# - backend-db-init.js → db/init.js
# - backend-reddit.js → scrapers/reddit.js
# - backend-problemExtractor.js → services/problemExtractor.js
# - backend-trendAnalyzer.js → services/trendAnalyzer.js
# - backend-server.js → server.js

npm install
```

### 2. Configure Environment

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-xxx
PORT=5000
NODE_ENV=development
DB_PATH=./data/problems.db
TARGET_SUBREDDITS=webdev,startups,IndieGaming
```

### 3. Initialize Database

```bash
npm run init-db
```

### 4. Start Backend Server

```bash
npm start
# Server runs on http://localhost:5000
```

Test it:
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

## Phase 2: Frontend Setup

### 1. Initialize Frontend

```bash
cd ../frontend
# Copy all frontend files

npm install
```

### 2. Configure Environment

Create `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Dev Server

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Phase 3: First Data Sync

### Option A: Manual Sync (via API)

```bash
curl -X POST http://localhost:5000/api/sync
```

Check progress in backend logs. First sync takes 2-3 minutes while Claude processes posts.

### Option B: Trigger from Dashboard

1. Open http://localhost:5173
2. Click **🔄 Refresh** button
3. Watch backend terminal for extraction progress

---

## 📊 What's Happening

```
Reddit Posts (latest) 
  ↓
Reddit Scraper (fetches 30 posts from target subreddits)
  ↓
Claude Problem Extractor (identifies problems in each post)
  ↓
SQLite Database (stores problems + metadata)
  ↓
React Dashboard (displays trending + filterable)
```

---

## 🎯 MVP Feature Checklist

- [x] Reddit scraper (public API)
- [x] Claude problem extraction
- [x] SQLite persistence
- [x] Problem trend scoring
- [x] React dashboard with filtering
- [x] Category aggregation
- [x] Source linkback to Reddit
- [ ] Scheduled daily sync (coming soon)
- [ ] Multi-platform scraping (coming soon)

---

## 🚀 Deploy to Production

### Backend (Node.js + Railway/Heroku)

```bash
# railway.app example
railway init
railway add nodejs
railway variables set ANTHROPIC_API_KEY=sk-ant-xxx
railway up
```

### Frontend (Vercel)

```bash
npm install -g vercel
vercel
# Follow prompts
# Set VITE_API_URL to production backend URL
```

---

## 🔧 Troubleshooting

### Claude API Rate Limit
**Problem**: Getting rate limited on extractions
**Solution**: Reduce `maxConcurrent` in `problemExtractor.js` from 3 to 1

### Database Locked
**Problem**: "database is locked" error
**Solution**: Kill any existing processes: `pkill -f server.js`

### No Problems Showing
**Problem**: Dashboard shows 0 problems
**Solution**: 
1. Check backend logs for API errors
2. Verify ANTHROPIC_API_KEY is set
3. Run manual sync: `curl -X POST http://localhost:5000/api/sync`

### CORS Issues
**Problem**: Frontend can't reach backend API
**Solution**: 
- Verify `VITE_API_URL` matches your backend URL
- Check backend has CORS enabled (it does by default)

---

## 📈 Next Steps for V1

1. **Scheduled Sync** — Add cron job for daily Reddit scrapes
2. **Multi-Source** — Add Twitter/Discord/Product Hunt scraping
3. **User Accounts** — Save favorite problems, track ideas
4. **Advanced Analytics** — Growth charts, sentiment trends
5. **Export** — CSV/JSON export for creators
6. **Mobile App** — React Native version

---

## 📚 Architecture

```
problem-radar/
├── backend/
│   ├── server.js              # Express + REST API
│   ├── db/
│   │   ├── init.js           # SQLite init
│   │   └── schema.sql        # Tables + indexes
│   ├── scrapers/
│   │   └── reddit.js         # Reddit API client
│   └── services/
│       ├── problemExtractor.js # Claude integration
│       └── trendAnalyzer.js   # Scoring logic
│
└── frontend/
    ├── App.jsx               # Main component
    ├── components/
    │   ├── Dashboard.jsx     # Layout + data fetch
    │   └── components.jsx    # Cards, filters, stats
    └── styles.css            # Complete styling
```

**Data Flow:**
```
Backend API → SQLite → Problem scoring → REST endpoints
                ↑
            Claude extracts
                ↑
            Reddit posts → Scraper
                ↑
            Target subreddits

React Client → Fetches from API → Displays + Filters
```

---

## 🎓 Key Concepts

**Trend Score** = (frequency × 40) + (growth × 30) + (sentiment × 30) + (recency × 10)

**Problem Extraction**: Claude reads each post and identifies:
- Core problem statement
- Category (AI Tools, Productivity, etc.)
- Sentiment (-1 = frustrated, 0 = neutral, 1 = excited)

**Categories**: Auto-detected from problem text using keyword matching

---

## 📞 Support

Questions or stuck?
- Check backend logs: `npm start`
- Check frontend console: Browser DevTools
- Verify API: `curl http://localhost:5000/api/problems`
- Check DB: `sqlite3 data/problems.db ".tables"`

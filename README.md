# 🎯 Problem Radar MVP

**Discover what creators want to build** — Real problems from Reddit + AI-powered extraction

A creator-focused problem discovery tool that scans Reddit communities to identify unmet needs, trending pain points, and market opportunities before anyone else.

---

## 🚀 What It Does

1. **Scrapes Reddit** — Fetches latest posts from target communities (webdev, startups, etc.)
2. **Extracts Problems** — Uses Claude AI to identify real problems from post text
3. **Scores Trends** — Ranks by frequency, growth, and sentiment
4. **Visualizes** — Beautiful dashboard showing top opportunities

## 🎯 Perfect For

- Indie hackers looking for what to build next
- Product managers validating ideas
- Entrepreneurs spotting market gaps
- SaaS founders finding pain points

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Anthropic Claude API key

### Run in 5 Minutes

```bash
# 1. Clone/extract files to problem-radar/ directory

# 2. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env - add ANTHROPIC_API_KEY
npm run init-db
npm start

# 3. In another terminal - Frontend setup
cd ../frontend
npm install
npm run dev

# 4. Open http://localhost:5173
# Click 🔄 Refresh to fetch and analyze Reddit posts
```

**First sync takes 2-3 min** (Claude is analyzing posts)

---

## 📊 Dashboard Features

- **Trending Problems** — Sorted by trend score
- **Category Filter** — Break down by AI Tools, Productivity, etc.
- **Problem Details** — See original Reddit threads
- **Stats Panel** — Overview of total problems, categories, sentiment
- **Live Updates** — Auto-refresh data every 5 minutes

---

## 🏗️ Architecture

### Backend (Node.js + Express)
- Reddit scraper (public API)
- Claude integration for problem extraction
- SQLite database for persistence
- REST API for frontend

### Frontend (React)
- Responsive dashboard
- Real-time filtering
- Modal detail view
- Clean, modern UI

### Data Flow
```
Reddit posts → Scrape → Extract (Claude) → Score → Database
                                              ↓
                                         API ↓ 
                                        Dashboard
```

---

## 🧠 How Problems Are Scored

```
Trend Score = (frequency × 0.4) + (growth × 0.3) + (sentiment × 0.3)
```

**Frequency**: How many times is this problem mentioned?
**Growth**: Is interest increasing or decreasing?
**Sentiment**: How frustrated/excited are people?

---

## 🔑 Key Files

### Backend
- `server.js` — Express app + API endpoints
- `scrapers/reddit.js` — Reddit data fetcher
- `services/problemExtractor.js` — Claude integration
- `services/trendAnalyzer.js` — Scoring logic
- `db/init.js` — Database setup

### Frontend
- `App.jsx` — Main component
- `components/Dashboard.jsx` — Layout + data fetch
- `components/` — Cards, filters, stats
- `styles.css` — Complete styling

### Data
- `db/schema.sql` — Database tables
- `jobs/dailySync.js` — Scheduled sync script

---

## 🚀 Deployment

### Backend → Railway/Heroku
```bash
railway init
railway variables set ANTHROPIC_API_KEY=sk-ant-xxx
railway up
```

### Frontend → Vercel
```bash
npm install -g vercel
vercel
# Set VITE_API_URL to your backend URL
```

See `SETUP_GUIDE.md` for detailed instructions.

---

## 🎯 MVP Scope (What's Done)

✅ Reddit scraper  
✅ Claude extraction  
✅ Trend scoring  
✅ React dashboard  
✅ Problem filtering  
✅ Source linkback  

## 📈 V1 Roadmap

🔲 Scheduled daily sync  
🔲 Multi-source (Twitter, Discord, ProductHunt)  
🔲 User accounts + saved problems  
🔲 Advanced analytics (growth charts)  
🔲 Export to CSV/JSON  
🔲 Mobile app (React Native)  

---

## 🛠️ Customization

### Change Target Subreddits
Edit `.env`:
```
TARGET_SUBREDDITS=python,django,learnprogramming
```

### Adjust Problem Categories
Edit `services/problemExtractor.js` → `categorizeProblems()`

### Change Sync Frequency
Edit `jobs/dailySync.js` or add cron:
```bash
0 8 * * * node /path/to/dailySync.js
```

---

## 📚 Tech Stack

**Backend**
- Node.js + Express
- SQLite3 (easy MVP, scales later)
- Anthropic Claude API
- node-fetch (Reddit API)

**Frontend**
- React 18
- Vite
- Plain CSS (no dependencies)

**Deployment**
- Railway/Heroku (backend)
- Vercel (frontend)

---

## 🤔 How It Works

### Example: Webdev Problem

1. **Post found**: "Why is there no tool for X?"
2. **Extracted**: Problem = "Missing tool for X", Category = "Development", Sentiment = frustrated
3. **Scored**: Mentions 5 times, growing, frustrated → Trend Score = 72
4. **Displayed**: Shows up in dashboard as top opportunity

### Example Use Case

Creator sees trending problem:
- "Hard to find AI SaaS boilerplates for specific tech stacks"
- 12 mentions, growing
- Opportunity: Build marketplace of ready-to-use AI starter kits

---

## 🧪 Testing

### Test API
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/problems?limit=5
curl http://localhost:5000/api/stats
```

### Test Extraction (Manual)
```bash
node -e "
import { ProblemExtractor } from './services/problemExtractor.js';
const e = new ProblemExtractor();
const post = { title: 'Why is testing slow?', content: 'Our CI takes hours' };
console.log(await e.extractProblems(post));
"
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "database is locked" | Kill old process: `pkill -f server.js` |
| Claude rate limit | Reduce `maxConcurrent` from 3 to 1 in problemExtractor.js |
| CORS errors | Check `VITE_API_URL` matches backend URL |
| No problems showing | Run manual sync: `curl -X POST http://localhost:5000/api/sync` |
| API Key error | Verify `ANTHROPIC_API_KEY` in .env |

---

## 📞 Getting Help

1. Check logs: `npm start` (backend) shows detailed output
2. Verify API: `curl http://localhost:5000/api/health`
3. Check database: `sqlite3 data/problems.db ".tables"`
4. Browser console: DevTools for frontend errors

---

## 📄 License

MIT — Build with it, share it, make it better!

---

## 🎓 Learn More

- [Anthropic Claude API Docs](https://docs.anthropic.com)
- [Reddit API Docs](https://www.reddit.com/dev/api/)
- [Vite React Setup](https://vitejs.dev/guide/#scaffolding-your-first-vite-project)

---

## 🙏 Built for Creators

Problem Radar is designed to help indie hackers, entrepreneurs, and developers discover real market opportunities hidden in community discussions.

**The insight**: The best ideas come from listening to what people actually struggle with, not guessing.

---

Made with ❤️ for creators who want to build what people actually need.

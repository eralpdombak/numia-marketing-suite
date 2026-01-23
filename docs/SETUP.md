# Setup Guide - B2B Marketing AI with Frontend Integration

**Last Updated:** 2025-12-29

This guide explains how to set up and use the complete system with local frontend integration.

---

## Quick Start (First Time Setup)

### 1. Prerequisites

Make sure you have installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python 3.9+** - Already installed
- **npm** (comes with Node.js)

Check your versions:
```bash
node --version  # Should be v18+
python3 --version # Should be 3.9+
npm --version   # Should be 8+
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies (API server)
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Python dependencies should already be installed
# If not: pip install -r requirements.txt
```

### 3. Start Development Environment

```bash
# One command starts everything!
npm run dev

# Or use the script directly:
./dev.sh
```

You should see:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 B2B Marketing AI Development Environment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Development Environment Ready!

📍 Services:
   • Local API:  http://localhost:3001
   • Frontend:   http://localhost:8080
```

### 4. Open Frontend

Open your browser to: **http://localhost:8080/library**

The Library should be empty (no content yet).

### 5. Generate Your First Content

In a new terminal (keep the dev environment running):

```bash
# Generate a LinkedIn post
python3 main.py linkedin "Why blockchain data APIs matter"

# Track it (creates entry in content_index.json)
python3 track_content.py
```

**Within 5 seconds**, the new post will appear in your Library frontend!

---

## How It Works

```
Python generates content → output/*.md files
    ↓
track_content.py scans → content_index.json updated
    ↓
Local API serves (port 3001) → Reads content_index.json
    ↓
Frontend polls API (every 5s) → Displays in Library
```

---

## Daily Workflow

### Starting Your Day

```bash
# Terminal 1: Start dev environment
npm run dev

# Open browser: http://localhost:8080/library
```

### Generating Content

```bash
# Terminal 2: Generate content
python3 main.py linkedin "topic here"
python3 track_content.py

# Or use Claude Code slash commands (if configured):
/linkedin "topic here"
```

### Viewing Content

- **Automatic:** Content appears in Library within 5 seconds
- **Features:**
  - Search by keyword
  - Filter by platform (LinkedIn, Twitter, Blog, Newsletter)
  - Sort by newest/oldest
  - Copy to clipboard
  - Delete (removes file permanently)
  - Bulk operations (select multiple)

### Stopping

```bash
# In dev environment terminal:
CTRL+C

# Everything stops gracefully
```

---

## File Structure

### New Files Added

```
b2b-marketing-ai/
├── server.js                # Local API server
├── package.json             # Node.js dependencies
├── dev.sh                   # Startup script
├── node_modules/            # API dependencies
├── frontend/
│   ├── .env.local           # Frontend config (local mode)
│   └── src/
│       ├── lib/
│       │   └── localApi.ts  # API client
│       └── pages/
│           └── Library.tsx  # Modified for local mode
└── SETUP.md                 # This file
```

### Modified Files

- `frontend/src/pages/Library.tsx` - Added local mode support
- `README.md` - Updated with frontend integration info

---

## Configuration

### Local Mode (Default)

**File:** `frontend/.env.local`
```bash
VITE_LOCAL_MODE=true
VITE_LOCAL_API_URL=http://localhost:3001
```

### Cloud Mode (Supabase)

To switch to cloud Supabase mode:

**File:** `frontend/.env.local`
```bash
VITE_LOCAL_MODE=false
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-key
```

Restart frontend after changing.

---

## API Endpoints

The local API server (`server.js`) provides:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/content` | List all content |
| GET | `/api/content/:id` | Get specific content (full text) |
| DELETE | `/api/content/:id` | Delete content |
| DELETE | `/api/content` | Bulk delete (body: `{ids: [...]}`) |

### Test API Manually

```bash
# Health check
curl http://localhost:3001/health

# List content
curl http://localhost:3001/api/content

# Get specific content
curl http://localhost:3001/api/content/BASE64_ID
```

---

## Troubleshooting

### API Won't Start

**Error:** "Port 3001 already in use"
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Try again
npm run dev
```

### Frontend Won't Load Content

1. **Check API is running:**
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"ok","mode":"local"}
   ```

2. **Check content_index.json exists:**
   ```bash
   ls -la content_index.json
   # Should exist with content
   ```

3. **Check browser console** (F12 → Console tab)
   - Look for API errors
   - Should see requests to `http://localhost:3001/api/content`

### Content Not Auto-Refreshing

- Make sure `VITE_LOCAL_MODE=true` in `frontend/.env.local`
- Refresh is every 5 seconds (check console for polling)
- Try manual refresh (reload page)

### Delete Doesn't Work

- Check API logs in terminal
- File should be removed from:
  - `output/*/filename.md`
  - `content_index.json` (removed from tracked_files)

---

## Advanced

### Change Auto-Refresh Interval

**File:** `frontend/src/pages/Library.tsx`
```typescript
const AUTO_REFRESH_INTERVAL = 5000; // Change to 10000 for 10 seconds
```

### Run Components Separately

```bash
# Terminal 1: API only
npm run api

# Terminal 2: Frontend only
npm run frontend
```

### Change Ports

**API:** Edit `server.js` line 8:
```javascript
const PORT = 3001; // Change to desired port
```

**Frontend:** Edit `frontend/vite.config.ts` line 10:
```typescript
port: 8080, // Change to desired port
```

Don't forget to update `frontend/.env.local` with new API URL!

---

## What's Next?

1. ✅ System is running
2. ✅ Content generation works
3. ✅ Frontend displays content
4. ✅ Real-time updates (5 seconds)

**Try these:**
- Generate multiple posts
- Use different platforms (linkedin, twitter, blog, newsletter)
- Search and filter in Library
- Copy content to clipboard
- Delete old content

**See also:**
- `INTEGRATION_PLAN.md` - Full technical details
- `ARCHITECTURE.md` - System architecture
- `README.md` - Project overview

---

## Support

**Issues?**
- Check this guide first
- Review `INTEGRATION_PLAN.md` for technical details
- Check browser console for errors
- Check terminal for API errors

**Everything working?** 🎉 Start creating content!

---

**End of Setup Guide**

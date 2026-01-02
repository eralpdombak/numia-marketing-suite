# Frontend Integration Plan
## Connecting Generated Content to React Library

**Goal:** Display Python-generated content files in the React frontend Library automatically

**Date:** 2025-12-29
**Status:** Planning Phase

---

## Executive Summary

Your frontend Library is already built and expecting content from Supabase, but your Python backend generates files locally. This plan creates a **local-first bridge** between them with minimal changes to your existing architecture.

**Key Decision:** Use a lightweight local API server to bridge Python → Frontend without requiring cloud Supabase.

---

## Current State Analysis

### ✅ What's Already Built

**Frontend (React + TypeScript)**
- Library page at `/library` (Library.tsx - 965 lines)
- Displays written content (text tab) and images (image tab)
- Reads from Supabase `library_items` table
- Features: search, filter by platform, sort, bulk delete, copy
- Platforms supported: linkedin, twitter, blog, newsletter

**Database Schema (Supabase)**
```sql
CREATE TABLE library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('text', 'image')),
  content TEXT NOT NULL,
  platform TEXT,  -- linkedin, twitter, blog, newsletter
  title TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

**Python Backend**
- `track_content.py` - Scans output/, generates summaries, saves to `content_index.json`
- Output directories:
  ```
  output/blog-posts/
  output/linkedin-posts/
  output/newsletters/
  output/twitter-threads/
  ```
- `content_index.json` structure:
  ```json
  {
    "tracked_files": {
      "output/blog-posts/2025-01-01_my-post.md": {
        "hash": "abc123",
        "content_type": "blog",
        "filename": "2025-01-01_my-post.md",
        "tracked_at": "2025-01-01T12:00:00",
        "summary": {
          "main_topic": "...",
          "key_points": ["..."],
          "tone": "...",
          "hook": "...",
          "use_case": "..."
        }
      }
    }
  }
  ```

### ❌ The Gap

**Python generates → Local files → content_index.json**
  ↓ (NO CONNECTION)
**Frontend expects → Supabase → library_items table**

---

## Solution: Local API Bridge

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   LOCAL DEVELOPMENT                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Python generates content                                   │
│      ↓                                                      │
│  track_content.py scans & summarizes                        │
│      ↓                                                      │
│  content_index.json (updated)                               │
│      ↓                                                      │
│  ┌────────────────────────────────────┐                     │
│  │   Simple Node.js API Server        │                     │
│  │   (new - 50 lines)                 │                     │
│  │                                    │                     │
│  │   GET /api/content                 │                     │
│  │   → Reads content_index.json       │                     │
│  │   → Returns in Supabase format     │                     │
│  │                                    │                     │
│  │   GET /api/content/:id             │                     │
│  │   → Reads actual file              │                     │
│  │                                    │                     │
│  │   POST /api/content                │                     │
│  │   → Adds to content_index.json     │                     │
│  │                                    │                     │
│  │   DELETE /api/content/:id          │                     │
│  │   → Removes from index & file      │                     │
│  └────────────────────────────────────┘                     │
│      ↑                                                      │
│      │ (HTTP requests)                                      │
│      ↓                                                      │
│  ┌────────────────────────────────────┐                     │
│  │   React Frontend                   │                     │
│  │   (modified Library.tsx)           │                     │
│  │                                    │                     │
│  │   - Detects LOCAL_MODE env var     │                     │
│  │   - Uses fetch() instead of        │                     │
│  │     Supabase client                │                     │
│  │   - Same UI, different data source │                     │
│  └────────────────────────────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Create Local API Server (30 minutes)

**File:** `/Users/eralpdombak/b2b-marketing-ai/server.js`

```javascript
// Simple Express server to serve content_index.json
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const CONTENT_INDEX = path.join(__dirname, 'content_index.json');
const OUTPUT_DIR = path.join(__dirname, 'output');

// Platform mapping
const platformMap = {
  'blog': 'blog',
  'linkedin': 'linkedin',
  'twitter': 'twitter',
  'newsletter': 'newsletter'
};

// GET /api/content - List all content
app.get('/api/content', async (req, res) => {
  try {
    const data = await fs.readFile(CONTENT_INDEX, 'utf-8');
    const index = JSON.parse(data);

    // Transform to Supabase format
    const items = Object.entries(index.tracked_files || {}).map(([filepath, meta]) => ({
      id: Buffer.from(filepath).toString('base64'), // Use filepath as ID
      type: 'text',
      content: '', // Will load on demand
      platform: platformMap[meta.content_type] || meta.content_type,
      title: meta.summary?.main_topic || meta.filename,
      created_at: meta.tracked_at,
      filepath: filepath, // Extra field for loading content
      summary: meta.summary
    }));

    res.json(items);
  } catch (error) {
    console.error('Error reading content index:', error);
    res.json([]);
  }
});

// GET /api/content/:id - Get specific content
app.get('/api/content/:id', async (req, res) => {
  try {
    const filepath = Buffer.from(req.params.id, 'base64').toString();
    const content = await fs.readFile(filepath, 'utf-8');

    const indexData = await fs.readFile(CONTENT_INDEX, 'utf-8');
    const index = JSON.parse(indexData);
    const meta = index.tracked_files[filepath];

    res.json({
      id: req.params.id,
      type: 'text',
      content: content,
      platform: platformMap[meta.content_type] || meta.content_type,
      title: meta.summary?.main_topic || meta.filename,
      created_at: meta.tracked_at,
      summary: meta.summary
    });
  } catch (error) {
    res.status(404).json({ error: 'Content not found' });
  }
});

// DELETE /api/content/:id - Delete content
app.delete('/api/content/:id', async (req, res) => {
  try {
    const filepath = Buffer.from(req.params.id, 'base64').toString();

    // Delete file
    await fs.unlink(filepath);

    // Update index
    const indexData = await fs.readFile(CONTENT_INDEX, 'utf-8');
    const index = JSON.parse(indexData);
    delete index.tracked_files[filepath];
    await fs.writeFile(CONTENT_INDEX, JSON.stringify(index, null, 2));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'local' });
});

app.listen(PORT, () => {
  console.log(`🚀 Local content API running on http://localhost:${PORT}`);
  console.log(`   Serving from: ${CONTENT_INDEX}`);
});
```

**Install dependencies:**
```bash
npm install express cors
```

---

### Phase 2: Add Local Mode to Frontend (15 minutes)

#### 2.1 Add Environment Variable

**File:** `/Users/eralpdombak/b2b-marketing-ai/frontend/.env.local` (create)
```bash
# Local development mode
VITE_LOCAL_MODE=true
VITE_LOCAL_API_URL=http://localhost:3001
```

#### 2.2 Create Local API Client

**File:** `/Users/eralpdombak/b2b-marketing-ai/frontend/src/lib/localApi.ts` (create)
```typescript
const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3001';

export interface LocalLibraryItem {
  id: string;
  type: 'text' | 'image';
  content: string;
  platform: string | null;
  created_at: string;
  title: string | null;
  summary?: {
    main_topic: string;
    key_points: string[];
    tone: string;
    hook: string;
    use_case: string;
  };
}

export const localApi = {
  async getAll(): Promise<LocalLibraryItem[]> {
    const response = await fetch(`${LOCAL_API_URL}/api/content`);
    if (!response.ok) throw new Error('Failed to fetch content');
    return response.json();
  },

  async getOne(id: string): Promise<LocalLibraryItem> {
    const response = await fetch(`${LOCAL_API_URL}/api/content/${id}`);
    if (!response.ok) throw new Error('Failed to fetch content');
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${LOCAL_API_URL}/api/content/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete content');
  },

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${LOCAL_API_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};
```

#### 2.3 Modify Library.tsx

**Changes needed in `/Users/eralpdombak/b2b-marketing-ai/frontend/src/pages/Library.tsx`:**

```typescript
// At top of file, add import
import { localApi } from "@/lib/localApi";

// Add environment check
const IS_LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';

// Modify loadLibraryItems function
const loadLibraryItems = async () => {
  setLoading(true);
  try {
    if (IS_LOCAL_MODE) {
      // Load from local API
      const data = await localApi.getAll();
      setTextItems(data.filter(item => item.type === "text"));

      const saved = localStorage.getItem(LIBRARY_STORAGE_KEY);
      if (saved) {
        setImageItems(JSON.parse(saved));
      }
    } else {
      // Load from Supabase (existing code)
      const { data, error } = await supabase
        .from("library_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTextItems((data as DbLibraryItem[]).filter(item => item.type === "text"));

      const saved = localStorage.getItem(LIBRARY_STORAGE_KEY);
      if (saved) {
        setImageItems(JSON.parse(saved));
      }
    }
  } catch (e) {
    console.error("Failed to load library:", e);
    toast.error("Failed to load library");
  } finally {
    setLoading(false);
  }
};

// Modify handleDeleteText function
const handleDeleteText = async (id: string) => {
  setDeleting(id);
  try {
    if (IS_LOCAL_MODE) {
      await localApi.delete(id);
      setTextItems(prev => prev.filter(item => item.id !== id));
    } else {
      const { error } = await supabase.from("library_items").delete().eq("id", id);
      if (error) throw error;
      setTextItems(prev => prev.filter(item => item.id !== id));
    }
    toast.success("Removed from library");
    if (selectedText?.id === id) {
      setSelectedText(null);
    }
  } catch (error) {
    console.error("Error deleting:", error);
    toast.error("Failed to delete");
  } finally {
    setDeleting(null);
  }
};

// Similarly update handleBulkDelete for local mode...
```

---

### Phase 3: Update Python Backend (10 minutes)

**Modify `/Users/eralpdombak/b2b-marketing-ai/track_content.py`:**

No changes needed! The current `content_index.json` format already works.
The Node.js API server will transform it to match Supabase format.

**Optional Enhancement:** Add a function to trigger content reload

```python
# Add at end of track_content.py
import requests

def notify_frontend(new_items):
    """Optional: Notify frontend of new content"""
    try:
        # Could add a webhook endpoint to the API server
        # for real-time updates (future enhancement)
        pass
    except:
        pass  # Silent fail - frontend will poll
```

---

### Phase 4: Startup Scripts (5 minutes)

#### 4.1 Create Startup Script

**File:** `/Users/eralpdombak/b2b-marketing-ai/dev.sh` (create)
```bash
#!/bin/bash
# Start both frontend and local API server

echo "🚀 Starting B2B Marketing AI Development Environment"
echo ""

# Start API server in background
echo "Starting local content API..."
node server.js &
API_PID=$!

# Wait for API to be ready
sleep 2

# Start frontend dev server
echo "Starting frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Trap CTRL+C to kill both processes
trap "echo 'Shutting down...'; kill $API_PID $FRONTEND_PID; exit" INT

echo ""
echo "✓ Local API running on http://localhost:3001"
echo "✓ Frontend running on http://localhost:8080"
echo ""
echo "Press CTRL+C to stop"

# Wait for processes
wait
```

Make executable:
```bash
chmod +x dev.sh
```

#### 4.2 Update package.json

**File:** `/Users/eralpdombak/b2b-marketing-ai/package.json` (create at root)
```json
{
  "name": "b2b-marketing-ai",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "./dev.sh",
    "api": "node server.js",
    "frontend": "cd frontend && npm run dev"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

---

## Usage After Implementation

### 1. Start Development Environment
```bash
# One command to start everything
npm run dev

# Or individually:
# Terminal 1: node server.js
# Terminal 2: cd frontend && npm run dev
```

### 2. Generate Content
```bash
# In another terminal
python3 track_content.py
# Content automatically appears in frontend Library!
```

### 3. View in Frontend
- Open http://localhost:8080/library
- See all generated content
- Filter by platform (blog, linkedin, twitter, newsletter)
- Search, sort, copy, delete

---

## Real-Time Updates (Optional Future Enhancement)

### Phase 5: Add WebSocket for Live Updates

**Option 1: File Watcher**
```javascript
// In server.js, add:
const chokidar = require('chokidar');

const watcher = chokidar.watch(CONTENT_INDEX);
watcher.on('change', () => {
  // Notify all connected frontends
  io.emit('content-updated');
});
```

**Option 2: Polling**
```typescript
// In Library.tsx, add:
useEffect(() => {
  const interval = setInterval(() => {
    loadLibraryItems(); // Refresh every 5 seconds
  }, 5000);

  return () => clearInterval(interval);
}, []);
```

---

## File Checklist

### Files to Create
- [ ] `/server.js` - Local API server
- [ ] `/package.json` - Root package file
- [ ] `/dev.sh` - Startup script
- [ ] `/frontend/.env.local` - Environment config
- [ ] `/frontend/src/lib/localApi.ts` - Local API client

### Files to Modify
- [ ] `/frontend/src/pages/Library.tsx` - Add local mode support

### Files to Read (No Changes)
- `/track_content.py` - Already compatible!
- `/content_index.json` - Already in good format!

---

## Testing Plan

### 1. Test API Server
```bash
# Start server
node server.js

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/content
```

### 2. Test Frontend
```bash
# Start frontend with local mode
cd frontend
VITE_LOCAL_MODE=true npm run dev

# Visit http://localhost:8080/library
# Should show empty state initially
```

### 3. Test Integration
```bash
# Generate content
python3 track_content.py

# Refresh frontend
# Should see new content appear!
```

---

## Rollback Plan

If anything breaks:
1. Set `VITE_LOCAL_MODE=false` in `.env.local`
2. Frontend reverts to Supabase
3. Delete `server.js` and root `package.json`
4. Everything works as before

---

## Advantages of This Approach

✅ **Minimal Changes**
- Only 5 new files
- ~100 lines of code total
- Existing code mostly untouched

✅ **Local-First**
- Zero cloud dependencies
- All data stays on your machine
- Fast (no network latency)

✅ **Backwards Compatible**
- Can toggle between local and Supabase
- Doesn't break existing frontend
- Python backend unchanged

✅ **Simple to Run**
- One command: `npm run dev`
- No Docker required
- No database to manage

✅ **Easy to Extend**
- Add WebSocket for real-time later
- Add more endpoints as needed
- Could add image support later

---

## Alternative Approaches (Considered & Rejected)

### ❌ Option 1: Local Supabase
- **Pros:** No frontend changes, keeps architecture
- **Cons:** Requires Docker, complex setup, overkill for local use

### ❌ Option 2: Tauri/Electron
- **Pros:** True native file access
- **Cons:** Huge refactor, adds complexity, defeats web app simplicity

### ❌ Option 3: Direct JSON File Access
- **Pros:** Simplest possible
- **Cons:** Can't work in browser, security issues, needs Electron anyway

---

## Timeline Estimate

| Phase | Time | Complexity |
|-------|------|------------|
| Create API Server | 30 min | Easy |
| Frontend Local Mode | 15 min | Easy |
| Update Python (none needed) | 0 min | N/A |
| Startup Scripts | 5 min | Easy |
| Testing | 10 min | Easy |
| **TOTAL** | **60 min** | **Low** |

---

## Success Criteria

✅ Content generated via Claude Code slash commands appears in Library
✅ Can view, search, filter, copy, delete from frontend
✅ Works completely offline (no Supabase connection)
✅ Startup takes one command
✅ Fast (<100ms response time)
✅ Can toggle back to Supabase mode if needed

---

## Next Steps

1. **Review this plan** - Any questions or concerns?
2. **Decide on approach** - Approve this plan or suggest changes?
3. **Implementation** - I can build all of this (30-60 minutes)
4. **Testing** - Verify everything works
5. **Documentation** - Update README with new workflow

---

## Questions for You

Before I implement, please confirm:

1. ✅ **Local-only is confirmed** - No cloud Supabase needed?
2. ❓ **Port preferences** - OK with API on :3001, frontend on :8080?
3. ❓ **Real-time updates** - Want live updates or manual refresh is OK?
4. ❓ **Image support** - Do you generate images too, or just text?
5. ❓ **Deletion behavior** - Should delete remove file permanently or just from index?

**Ready to implement?** Say "go" and I'll start building! 🚀

---

**End of Integration Plan**

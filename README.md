# Numia Marketing Suite

Two tools in one repo for creating marketing content:

1. **AI Content Generator** - Uses Claude to write marketing copy (blogs, LinkedIn, Twitter, emails)
2. **Perfect Shot** - Screenshot mockup editor for making product shots look good

## What's What

### Backend (Python + Node.js)

The backend handles content generation and storage:

- **Python side** (`main.py`, `track_content.py`) - Generates content using Claude API, saves to markdown files
- **Node.js server** (`server.js`) - REST API so the frontend can list/delete content
- **Claude Code commands** (`.claude/commands/`) - Slash commands for quick content generation

Content types: blog posts, LinkedIn posts, Twitter threads, marketing emails, competitor analysis, research

### Frontend (React + TypeScript)

Screenshot mockup tool called "Perfect Shot". Upload any image and turn it into a mockup with:

- Browser window frames
- 3D tilt effects (perspective transforms)
- Custom backgrounds (solid colors or SVG patterns)
- Shadows and brand watermarks
- High-quality PNG export

Built with React, TypeScript, Tailwind CSS, and Vite.

## Getting Started

### What You Need

**Backend:**
- Python 3.8+
- Node.js 16+
- Claude API key (for Python content generation)
- Claude Code CLI (for slash commands)

**Frontend:**
- Node.js 16+
- npm or bun

### Backend Setup

1. Create virtual environment and install Python dependencies:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Set up your API key:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

3. Install Node dependencies for the API server:
```bash
npm install
```

4. Start the content API server:
```bash
./dev.sh
```

Or run it manually:
```bash
node server.js
```

Server runs on `http://localhost:3001`

### Frontend Setup

1. Go to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start dev server:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## Using the Content Generator

### Method 1: Python CLI

```bash
# Blog post
python3 main.py blog "your topic here"

# LinkedIn post
python3 main.py linkedin "your topic here"

# Twitter thread
python3 main.py thread "your topic here"

# Newsletter
python3 main.py newsletter "your topic here"

# Let AI pick the topic
python3 main.py blog
```

Add perspectives to enrich content:
```bash
python3 main.py blog "cross-chain data" --perspectives developer,investor
```

Available perspectives:
- `investor` - Market opportunity, ROI, business value
- `crypto-expert` - Protocol details, consensus mechanisms
- `developer` - Implementation, code examples, debugging
- `business` - Team productivity, cost analysis
- `researcher` - Academic foundations, theory

### Method 2: Claude Code Slash Commands

From the project root with Claude Code:

```
/blog [topic]        - Write a blog post
/linkedin [topic]    - Create LinkedIn post
/twitter [topic]     - Generate Twitter thread
/email [topic]       - Write marketing email
/research [topic]    - Research something
/competitor [name]   - Analyze competitors
```

Generated content saves to `output/` as markdown files and gets tracked in `content_index.json`.

### Content Tracking

See what you've generated:
```bash
python3 track_content.py --summary
```

Track new content (detects duplicates via hash):
```bash
python3 track_content.py
```

## Using Perfect Shot

1. Open frontend at `http://localhost:5173`
2. Click "Shots" in navigation
3. Upload an image (drag/drop or click to browse)
4. Customize:
   - **Device Type**: None (just image) or Browser (Chrome-style frame)
   - **Background**: Pick from presets or upload custom
   - **3D Rotation**: Tilt on X/Y axis for perspective
   - **Scale**: Make image bigger/smaller
   - **Shadow**: Drop shadow on/off
   - **Border Radius**: Round the corners
   - **Branding**: Add "NUMIA" watermark (position it anywhere or hide it)
5. Export as PNG or save to library

### Library Page

Shows all saved mockups and generated text content:

- Search and filter
- Delete items (removes from backend too)
- Re-export saved mockups
- View all generated marketing content

Mockups save to browser localStorage. Text content syncs with the backend API.

## How It Works

### AI Content Generation

The system uses a "brand memory" approach:

1. Loads brand context from `memory/numia_brand.md` (voice, tone, products, audience)
2. Applies content type guidelines from `memory/post-guidelines/`
3. Optionally enriches with perspective insights from `memory/perspectives/`
4. Uses Claude API to generate on-brand content
5. Saves to `output/` directory as markdown

All content follows Numia's guidelines:
- Sound human (use contractions, break grammar rules when natural)
- Be specific (real numbers, not vague claims)
- Show, don't tell (examples over concepts)
- Lead with data
- Avoid buzzwords ("leverage", "seamless", "robust", etc.)

### 3D Screenshot Rendering

Perfect Shot uses two rendering systems:

**Preview (CSS 3D Transforms):**
- Fast, smooth interaction
- Real-time updates as you adjust settings
- Uses CSS `transform: perspective() rotateY() rotateX()`

**Export (Canvas 2D Rendering):**
- High quality (2400x1500px)
- Accurate 3D perspective using transformation matrices
- Mathematical simulation of perspective distortion
- Exports as PNG with perfect quality

Why two systems? CSS transforms look good on screen but don't export well with html2canvas. The canvas renderer gives you perfect exports.

### Storage

**Backend (Text Content):**
- Generated markdown files → `output/` directory
- Metadata index → `content_index.json`
- API serves content to frontend

**Frontend (Mockups):**
- Saved as base64 PNG in browser localStorage
- Key: `numia-shots-library`
- Auto-removes oldest items if quota exceeded (~5-10MB browser limit)

## API Endpoints

Node.js server (`server.js`) provides:

```
GET    /api/content       - List all content
GET    /api/content/:id   - Get specific item
DELETE /api/content/:id   - Delete content (removes file + index entry)
```

CORS enabled for `localhost:5173` (frontend dev server).

## Project Structure

```
numia-marketing-suite/
├── frontend/                       # Perfect Shot mockup tool
│   ├── src/
│   │   ├── components/
│   │   │   ├── MockupEditor.tsx           # Main editor
│   │   │   ├── Canvas3DRenderer.tsx       # Canvas export renderer
│   │   │   ├── MockupCanvas.tsx           # Preview with CSS 3D
│   │   │   ├── DeviceFrames.tsx           # Browser frame
│   │   │   └── ui/                        # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── Index.tsx                  # Landing
│   │   │   ├── Home.tsx                   # Mockup editor
│   │   │   └── Library.tsx                # Content library
│   │   ├── assets/backgrounds/            # SVG patterns
│   │   └── lib/                           # Utils & API client
│   ├── package.json
│   └── vite.config.ts
│
├── memory/                         # Brand context & guidelines
│   ├── numia_brand.md                     # Main brand memory
│   ├── perspectives/                      # Content perspectives
│   └── post-guidelines/                   # Type-specific rules
│
├── output/                         # Generated content
│   ├── blogs/
│   ├── linkedin/
│   ├── newsletters/
│   └── threads/
│
├── .claude/commands/               # Slash command definitions
│   ├── blog.md
│   ├── linkedin.md
│   ├── twitter.md
│   └── email.md
│
├── src/                            # Python content generator
├── main.py                         # CLI entry point
├── track_content.py                # Content tracking
├── server.js                       # Node.js API server
├── dev.sh                          # Start server script
└── content_index.json              # Content metadata
```

## Common Issues

### "Frontend can't fetch content"

Make sure backend server is running:
```bash
./dev.sh
# or
node server.js
```

Check it's on port 3001. Look for CORS errors in browser console.

### "Export images look weird"

Wait a second after adjusting 3D rotation before exporting. The canvas renderer needs time to draw at high resolution.

If it still looks wrong, check browser console for errors.

### "localStorage quota exceeded"

The app auto-removes old mockups when you run out of space. Each PNG is ~200-500KB in base64. Browser limit is usually 5-10MB.

If you want to keep everything, export your mockups as files instead of saving to library.

### "Content deletion fails"

- Verify backend server is running
- Check file permissions in `output/` directory
- Look at server logs (terminal where you ran `node server.js`)

### "Claude API errors"

Make sure your `.env` file has a valid `ANTHROPIC_API_KEY`. Check your API quota at console.anthropic.com.

## Development Notes

### Frontend

Hot reload is enabled. Edit files in `frontend/src/` and see changes instantly.

Uses shadcn/ui for components. To add new ones:
```bash
cd frontend
npx shadcn-ui@latest add [component-name]
```

### Adding Content Types

1. Create new slash command in `.claude/commands/[name].md`
2. Write prompt that generates your content type
3. Make sure it saves to `output/` somewhere
4. Run `/[name] [topic]` to test

### Design System

Tailwind CSS with custom config. Theme:
- Industrial/technical aesthetic
- Monospace fonts for UI chrome
- Zinc color palette (dark)
- Fine borders, technical accents
- Minimalist and functional

### Brand Context

Update `memory/numia_brand.md` when:
- Product features change
- Pricing updates
- New performance metrics
- Brand voice evolves

The AI reads this file before generating content, so keep it current.

## Key Company Facts

- **Company**: Numia.xyz
- **Founded**: 2021
- **Scale**: 100+ blockchains, 5B+ monthly API requests
- **Products**: Data APIs, Chain Dashboards, Numia Engage, Data Warehouse, Alert System
- **Target**: L1/L2 teams, developers, ecosystem growth leads

## Version Info

**Last Updated**: 2026-01-02
**License**: Internal use only (Numia proprietary)

---

Questions? Something broken? Check the issues or ask the team.

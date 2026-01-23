# B2B Marketing AI - Architecture & File Structure Research

**Generated:** 2025-12-29
**Project:** Numia's AI-powered marketing content generator
**Version:** 1.0.0

---

## Executive Summary

**Deployment Model:** Local-First Development Tool

This project is a dual-system marketing automation platform designed for **local development and use**:

1. **Backend System** - Python-based AI content generator using Anthropic's Claude API
2. **Frontend System** - React/TypeScript web application for visual content creation and management
3. **Intelligence System** - Structured brand knowledge base and content guidelines
4. **Content Pipeline** - Automated generation, tracking, and organization system

**Important:** This is optimized for local workflows, not production deployment. File-based storage and local execution are intentional design choices for simplicity and developer experience.

---

## Quick Navigation

**Most Important Sections:**
1. [Missing Components](#missing-components--known-gaps) - **Start here** - Critical gap: main.py missing
2. [Intelligence System](#1-intelligence-system-intelligence) - Core brand knowledge architecture
3. [Content Tracking](#3-python-backend-system) - How content is tracked and summarized
4. [Frontend System](#4-frontend-system-frontend) - React app architecture
5. [Recommended Improvements](#recommended-improvements-local-development-focus) - What to build next

**Key Insights:**
- **Local-first design** is intentional - no deployment needed
- **File-based JSON tracking** is appropriate for single-user use
- **Frontend gitignored** is by design (Lovable.dev integration)
- **main.py is missing** - only critical blocker for content generation

---

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    B2B MARKETING AI                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  Python Backend  │────────▶│  Anthropic API   │        │
│  │  Content Engine  │         │  (Claude 3.7)    │        │
│  └──────────────────┘         └──────────────────┘        │
│          │                                                  │
│          ▼                                                  │
│  ┌──────────────────┐                                      │
│  │  Intelligence    │                                      │
│  │  System (MD)     │                                      │
│  └──────────────────┘                                      │
│          │                                                  │
│          ▼                                                  │
│  ┌──────────────────┐                                      │
│  │  Output System   │                                      │
│  │  (Tracked)       │                                      │
│  └──────────────────┘                                      │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │         React Frontend (Perfect Shot)        │          │
│  │  ┌────────────┐  ┌────────────┐             │          │
│  │  │  Vite +    │  │  Supabase  │             │          │
│  │  │  TypeScript│  │  Backend   │             │          │
│  │  └────────────┘  └────────────┘             │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure Analysis

### Root Level
```
b2b-marketing-ai/
├── .claude/              # Claude Code custom commands
├── .git/                 # Git repository
├── archive/              # Legacy code/templates (gitignored)
├── frontend/             # React web application (gitignored)
├── intelligence/         # Brand knowledge base
├── output/               # Generated content (gitignored)
├── venv/                 # Python virtual environment
├── .env                  # API keys (gitignored)
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
├── README.md             # Project documentation
├── requirements.txt      # Python dependencies
├── track_content.py      # Content tracking system
└── test_screenshot.png   # Test asset
```

### 1. Intelligence System (`/intelligence/`)

**Purpose:** Centralized brand knowledge base and content guidelines

```
intelligence/
├── brand-guidelines/     # Core brand documentation (9 files)
│   ├── 01-company-fundamentals.md
│   ├── 02-brand-identity.md
│   ├── 03-content-creation-guidelines.md
│   ├── 04-writing-process-quality-control.md
│   ├── 05-engagement-measurement.md
│   ├── 06-strategy-compliance.md
│   ├── 07-examples-reference.md
│   ├── 08-core-philosophy.md
│   └── README-brand-guidelines.md
│
├── perspectives/         # Multi-perspective content enrichment
│   ├── business.md       # ROI, productivity, cost analysis
│   ├── crypto-expert.md  # Technical protocol analysis
│   ├── developer.md      # Implementation guidance
│   ├── investor.md       # Market opportunity, positioning
│   └── researcher.md     # Academic foundations
│
├── post-guidelines/      # Content type specifications
│   └── [specific content type rules]
│
└── research/             # Reference materials and docs
    └── [research documents]
```

**Architecture Pattern:** File-based knowledge graph
- **Modular:** Each concern separated into individual files
- **Scalable:** Easy to add new perspectives/guidelines
- **AI-Friendly:** Markdown format for easy ingestion by LLMs
- **Version-Controlled:** All knowledge changes tracked in git

**Key Insights:**
- Brand guidelines follow a numbered sequence for systematic loading
- Perspectives enable multi-audience content generation from single prompts
- Separation of concerns: brand identity vs. content rules vs. examples

### 2. Output System (`/output/`)

**Purpose:** Organized storage of generated content

```
output/
├── blog-posts/           # Long-form technical SEO content
├── linkedin-posts/       # Professional 80-200 word posts
├── newsletters/          # Email format with subject lines
├── twitter-threads/      # 5-15 tweet threads
└── visuals/              # Generated visual assets
```

**Architecture Pattern:** Type-based organization
- **Separation:** Each content type in its own directory
- **Discoverability:** Clear naming convention
- **Tracking:** Monitored by `track_content.py`
- **Git Strategy:** Ignored in git (ephemeral outputs)

**Content Lifecycle:**
1. Generated → Saved to type-specific directory
2. Tracked → Hashed and summarized by `track_content.py`
3. Indexed → Added to `content_index.json` (also gitignored)
4. Searchable → Available via `--summary` command

### 3. Python Backend System

**Core File:** `track_content.py` (193 lines)

**Architecture Pattern:** Event-driven content management

**Key Components:**

```python
CONTENT_INDEX = "content_index.json"
OUTPUT_DIRS = {
    "blog": "output/blog-posts",
    "linkedin": "output/linkedin-posts",
    "newsletter": "output/newsletters",
    "twitter": "output/twitter-threads"
}
```

**Functions:**
- `get_file_hash()` - MD5 hash for duplicate detection
- `load_index()` / `save_index()` - JSON persistence
- `summarize_content()` - AI-powered content analysis via Claude
- `scan_and_track()` - Directory scanning and tracking
- `show_summary()` - Content library display

**AI Integration:**
- Model: `claude-3-7-sonnet-20250219`
- Max tokens: 500 (optimized for summaries)
- Output format: Structured JSON
  ```json
  {
    "main_topic": "string",
    "key_points": ["array"],
    "tone": "string",
    "hook": "string",
    "use_case": "string"
  }
  ```

**Dependencies** (`requirements.txt`):
```
anthropic>=0.18.0          # Core AI functionality
pyyaml>=6.0                # Configuration parsing
python-dotenv>=1.0.0       # Environment management
requests>=2.31.0           # HTTP requests
feedparser>=6.0.10         # RSS/feed parsing
beautifulsoup4>=4.12.0     # HTML parsing
Pillow>=10.0.0             # Image generation
```

**Notable Missing File:**
- No `main.py` found in current state (referenced in README)
- Suggests recent refactoring or incomplete migration
- README references commands like `python3 main.py blog "topic"`

### 4. Frontend System (`/frontend/`)

**Stack:** React + TypeScript + Vite + Supabase

**Purpose:** Visual content creation and management interface

```
frontend/
├── node_modules/         # Dependencies (gitignored)
├── public/               # Static assets
├── src/                  # Source code
│   ├── assets/           # Images, fonts, etc.
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components (51 files)
│   │   ├── ControlPanel.tsx
│   │   ├── MockupCanvas.tsx
│   │   ├── MockupEditor.tsx
│   │   └── [8 more components]
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # External service integrations
│   │   └── supabase/     # Supabase client
│   ├── lib/              # Utility functions
│   ├── pages/            # Route pages
│   │   ├── Agent.tsx
│   │   ├── Braindump.tsx
│   │   ├── Home.tsx
│   │   ├── Index.tsx (Shots)
│   │   ├── Intelligence.tsx
│   │   ├── Library.tsx
│   │   ├── NotFound.tsx
│   │   └── Simulator.tsx
│   ├── types/            # TypeScript definitions
│   ├── App.tsx           # Main app component
│   ├── App.css           # App styles
│   ├── index.css         # Global styles
│   └── main.tsx          # Entry point
├── supabase/
│   ├── functions/        # Edge functions
│   ├── migrations/       # Database migrations
│   └── config.toml       # Supabase config
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind config
└── vite.config.ts        # Vite config
```

**Key Technologies:**
- **UI Framework:** React 18.3.1
- **Routing:** react-router-dom 6.30.1
- **State Management:** @tanstack/react-query 5.83.0
- **UI Components:** Radix UI (comprehensive set)
- **Styling:** Tailwind CSS 3.4.17 + shadcn/ui
- **Charts:** recharts 2.15.4
- **Backend:** Supabase (auth, database, storage)
- **Build Tool:** Vite 5.4.19
- **Canvas:** html2canvas 1.4.1 (screenshot generation)

**Page Architecture:**

1. **Home** - Landing/dashboard
2. **Shots (Index)** - Screenshot/visual creation
3. **Library** - Content library management (39k+ lines)
4. **Agent** - AI agent interface (15k+ lines)
5. **Braindump** - Idea organization (22k+ lines)
6. **Intelligence** - Knowledge base interface (18k+ lines)
7. **Simulator** - Preview/simulation tool (18k+ lines)

**Component Strategy:**
- **UI Components:** 51 shadcn/ui components for consistency
- **Custom Components:** 11 project-specific components
- **Code Density:** Large page files (15k-40k lines) suggest feature-rich interfaces

**Routing Structure:**
```typescript
/ → Home
/shots → Visual creation
/library → Content management
/agent → AI interaction
/simulator → Preview tool
/braindump → Idea organization
/intelligence → Knowledge base
/* → 404 Not Found
```

**Backend Integration (Supabase):**
- **Authentication:** User management
- **Database:** Content storage via migrations
- **Edge Functions:** Serverless API endpoints
- **Real-time:** Potential live updates

### 5. Claude Code Integration (`/.claude/`)

**Purpose:** Custom slash commands for workflow automation

```
.claude/
└── commands/
    ├── README.md
    ├── content-library.md
    ├── newsletter.md
    ├── track.md
    └── trash.md
```

**Available Commands:**
- `/competitor` - Competitive analysis
- `/research` - Topic research
- `/blog` - Blog post generation
- `/braindump` - Thought organization
- `/twitter` - Twitter thread creation
- `/linkedin` - LinkedIn post creation
- `/email` - Email marketing
- `/track` - Content tracking
- `/content-library` - Library view

**Architecture Pattern:** Command-based automation
- Project-specific commands gitignored
- Enables quick content generation workflows
- Integration with main Python system

### 6. Archive System (`/archive/`)

```
archive/
└── old-system/
    └── src/
```

**Purpose:** Deprecated code and templates
- Contains previous implementation
- Gitignored to reduce clutter
- Preserved for reference/rollback

---

## Data Flow Architecture

### Content Generation Flow

```
User Input (Topic + Perspective)
    ↓
main.py (CLI)
    ↓
Intelligence System (Load brand guidelines + perspectives)
    ↓
Anthropic API (Claude 3.7 Sonnet)
    ↓
Generated Content
    ↓
Output Directory (Type-based)
    ↓
track_content.py (Hash + Summarize)
    ↓
content_index.json (Persistent storage)
```

### Frontend Data Flow

```
User Interaction (React UI)
    ↓
React Components
    ↓
React Query (State management)
    ↓
Supabase Client
    ↓
Supabase Backend (Auth/DB/Storage)
    ↓
Edge Functions (Business logic)
    ↓
Response → UI Update
```

---

## Key Architectural Patterns

### 1. **File-Based Knowledge Graph**
- Intelligence system uses markdown files
- Git-tracked for version control
- AI-ingestible format
- Modular and maintainable

### 2. **Type-Based Content Organization**
- Separate directories per content type
- Consistent naming conventions
- Automated tracking system
- Hash-based deduplication

### 3. **Multi-Perspective Enrichment**
- Single input → Multiple viewpoints
- Composable perspectives
- Context injection pattern
- Audience-aware generation

### 4. **Dual-System Architecture**
- Backend: Python + AI (content generation)
- Frontend: React + Supabase (visual management)
- Separation of concerns
- Independent scaling

### 5. **Event-Driven Content Management**
- File system monitoring
- Hash-based change detection
- Lazy summarization (only when changed)
- JSON persistence

### 6. **Component-Based UI**
- shadcn/ui for consistency
- Radix UI primitives
- Tailwind for styling
- TypeScript for type safety

---

## Technology Stack Summary

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.9 | Runtime environment |
| Anthropic SDK | ≥0.18.0 | AI integration |
| PyYAML | ≥6.0 | Configuration parsing |
| python-dotenv | ≥1.0.0 | Environment management |
| Requests | ≥2.31.0 | HTTP client |
| BeautifulSoup4 | ≥4.12.0 | HTML parsing |
| Pillow | ≥10.0.0 | Image processing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 5.4.19 | Build tool |
| React Router | 6.30.1 | Routing |
| TanStack Query | 5.83.0 | State management |
| Supabase | 2.89.0 | Backend service |
| Tailwind CSS | 3.4.17 | Styling |
| Radix UI | Various | UI primitives |
| shadcn/ui | Various | Component library |
| Recharts | 2.15.4 | Data visualization |
| html2canvas | 1.4.1 | Screenshot generation |

---

## Configuration & Environment

### Environment Variables (`.env`)
```bash
ANTHROPIC_API_KEY=sk-ant-...  # Required for content generation
# Additional vars likely for Supabase (not in .env.example)
```

### Git Strategy
**Tracked:**
- Source code (Python, TypeScript)
- Intelligence files (brand guidelines, perspectives)
- Configuration templates (.env.example)
- Documentation (README, this file)

**Ignored:**
- Environment files (.env)
- Dependencies (venv/, node_modules/)
- Generated content (output/, content_index.json)
- Archive (old-system/)
- Frontend build artifacts
- Claude commands (.claude/commands/)
- IDE files (.vscode/, .idea/)

---

## Missing Components & Known Gaps

### 1. **Missing main.py** ⚠️ CRITICAL
- Referenced extensively in README.md:18-120
- Core CLI entry point for content generation
- Commands like `python3 main.py blog "topic"` won't work
- **Impact:** Cannot run primary content generation workflows
- **Action:** Restore from git history or recreate

### 2. **Frontend Separation** ✅ INTENTIONAL
- Frontend is gitignored (by design)
- Likely managed via Lovable.dev platform
- Keeps git history clean (no node_modules churn)
- **Not a bug:** Appropriate for local development

### 3. **Documentation Gaps** ℹ️
- ~~No architecture documentation~~ (addressed by this doc)
- No local setup guide (add SETUP.md)
- No troubleshooting guide
- No contribution guidelines

### 4. **Testing Infrastructure** ⚠️
- No test files visible
- No testing framework in requirements.txt
- **Recommendation:** Add pytest for core functions
- **Priority:** Medium (local tool, but tests improve reliability)

### 5. **Type Safety** ℹ️
- Python code lacks type hints
- No mypy or similar type checking
- Could benefit from Pydantic models
- **Priority:** Low (nice-to-have for IDE support)

---

## Security Considerations (Local Context)

**Note:** As a local-first tool, security model differs from production systems. Relies on OS-level security.

### Secrets Management
- ✅ .env file gitignored (never commits secrets)
- ✅ .env.example as template (safe to share)
- ✅ Local-only (API keys never leave your machine)
- ℹ️  Secrets scanning not needed (no CI/CD, no deployment)
- ℹ️  Key rotation strategy: manual (appropriate for single user)

### API Security
- **Anthropic API:** Uses local .env key, rate limits managed by provider
- **Supabase:** Frontend auth handled by Supabase SDK
- **No encryption needed:** Keys stored in OS filesystem (protected by OS permissions)

### Content Security
- ✅ Generated content is local (gitignored, never pushed)
- ✅ Brand guidelines are proprietary (but version controlled intentionally)
- ✅ Intelligence system is the source of truth (meant to be tracked)
- ℹ️  Encryption at rest: Relies on OS (FileVault, BitLocker, etc.)

### Threat Model (Local Development)
**Protected against:**
- ✅ Accidental secret commits (gitignore)
- ✅ Public exposure (local-only execution)

**Not protected against (acceptable for local use):**
- ⚠️  Physical access to developer machine (OS responsibility)
- ⚠️  Malware on developer machine (OS/antivirus responsibility)

**Recommendation:** Enable OS-level encryption (FileVault/BitLocker) for proprietary intelligence files.

---

## Performance & Local Optimization

**Note:** As a local-first tool, scalability concerns are minimal. Design prioritizes developer experience over enterprise-scale performance.

### Content Generation
- **Bottleneck:** Anthropic API rate limits (acceptable for local use)
- **Optimization:** Sequential processing keeps code simple
- **Caching:** Not needed - content generated on-demand

### Content Tracking
- **Storage:** JSON file (content_index.json) - **Appropriate for local use**
- **Performance:** O(n) scans on each run - Fast enough for hundreds of files
- **Benefits:** Human-readable, git-diffable, zero dependencies
- **When to upgrade:** Only if tracking 10,000+ files (unlikely for single user)

### Frontend
- **Build:** Vite (blazing fast for local dev)
- **Development:** Hot module replacement (HMR)
- **Optimization:** Code splitting via React Router
- **Local performance:** Excellent - sub-second rebuilds

---

## Local Development Architecture

**Design Philosophy:** Local-first, no deployment required

### Backend Setup
- **Execution:** Direct Python via CLI (`python3 track_content.py`)
- **Environment:** Local virtual environment (venv)
- **Dependencies:** pip install -r requirements.txt
- **No containerization needed** - Python venv provides isolation

### Frontend Setup
- **Development:** `npm run dev` (Vite dev server on localhost:5173)
- **Platform:** Lovable.dev (for prototyping/preview only)
- **Primary use case:** Local development
- **No production deployment needed**

### Why Local-First?
1. **Simplicity:** No infrastructure to manage
2. **Security:** API keys stay on your machine
3. **Speed:** No network latency for local operations
4. **Cost:** Zero hosting costs
5. **Privacy:** Brand intelligence never leaves your machine

---

## Recommended Improvements (Local Development Focus)

### Short-Term (Developer Experience)
1. **Restore main.py** or create new entry point for content generation
2. **Add .gitkeep files** to empty output directories (git structure)
3. **Create CONTRIBUTING.md** with local setup instructions
4. **Add type hints** to Python code (better IDE support)
5. **Quick start script** (setup.sh for one-command setup)

### Medium-Term (Quality of Life)
1. **Add unit tests** for core functions (local testing)
2. **Pre-commit hooks** (format code, run linters locally)
3. **VSCode workspace settings** (consistent dev environment)
4. **Makefile or task runner** (common commands: make setup, make track)
5. **Error handling improvements** (better CLI feedback)

### Long-Term (Nice to Have)
1. **TUI (Terminal UI)** for interactive content generation (using Rich/Textual)
2. **Local analytics** (track your own content performance in JSON)
3. **Plugin system** for custom perspectives (load from plugins/ directory)
4. **Export formats** (Markdown → PDF, HTML, etc.)
5. **Content templates** (reusable structures for common post types)

### Explicitly NOT Recommended (Keep It Local)
- ❌ REST API (adds complexity, no multi-user need)
- ❌ Database migration (JSON is perfect for local use)
- ❌ Docker (venv is simpler for single developer)
- ❌ CI/CD (local tool, no deployment)
- ❌ Multi-tenancy (single brand use case)

---

## Conclusion

This project demonstrates a **well-designed local-first marketing automation tool**:

**Strengths:**
- ✅ Well-organized intelligence system (file-based knowledge graph)
- ✅ Clean separation of concerns (backend/frontend/intelligence)
- ✅ Modern frontend stack (React + TypeScript + Vite)
- ✅ AI-first design (leverages Claude API effectively)
- ✅ Type-based content organization (intuitive folder structure)
- ✅ **Local-first philosophy** (simple, fast, private, zero infra costs)
- ✅ **Appropriate tech choices** (JSON for tracking, venv for isolation)

**Areas for Improvement:**
- ⚠️  Missing core entry point (main.py) - needs restoration
- ⚠️  No testing infrastructure (add unit tests for reliability)
- ⚠️  Limited error handling (improve CLI feedback)
- ⚠️  Documentation gaps (this doc addresses architecture)

**Architecture Grade for Local Tool: A-**
- **Excellent** for local development use case
- Simple, maintainable, appropriate technology choices
- File-based storage is a strength, not a weakness
- Frontend/backend separation provides flexibility
- Missing main.py is the only critical gap

**Perfect for:**
- Single developer/marketer workflows
- Rapid content generation with brand consistency
- Private, local-first AI automation
- Learning and experimentation

**Not designed for:**
- Multi-user teams (and that's okay)
- Production deployment (intentionally local)
- Enterprise scale (unnecessary for use case)

---

## Appendix A: File Count Summary

| Directory | Files | Purpose |
|-----------|-------|---------|
| `/intelligence/brand-guidelines/` | 9 | Core brand docs |
| `/intelligence/perspectives/` | 5 | Content perspectives |
| `/intelligence/post-guidelines/` | ~4 | Content type rules |
| `/intelligence/research/` | ~8 | Reference materials |
| `/frontend/src/components/ui/` | 51 | UI components |
| `/frontend/src/pages/` | 8 | Route pages |
| `/.claude/commands/` | 5 | Slash commands |
| Root Python files | 1 | track_content.py |

**Total Intelligence Files:** ~26
**Total Frontend Source Files:** ~100+
**Total Project Files:** ~150+ (excluding node_modules, venv)

---

## Appendix B: Port & Service Map

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Frontend Dev | 5173 | HTTP | Vite dev server |
| Supabase Local | 54321 | HTTP | Local Supabase API |
| Anthropic API | 443 | HTTPS | Claude AI service |

---

## Appendix C: Key Dependencies Graph

```
Backend Dependencies:
anthropic ─┬─> httpx
           └─> pydantic
python-dotenv
pyyaml
requests ─> urllib3
beautifulsoup4 ─> html5lib
Pillow

Frontend Dependencies:
react ─┬─> react-dom
       └─> scheduler
@tanstack/react-query
@supabase/supabase-js ─> cross-fetch
react-router-dom ─> react-router
tailwindcss ─┬─> postcss
             └─> autoprefixer
vite ─┬─> esbuild
      └─> rollup
```

---

**Document End**

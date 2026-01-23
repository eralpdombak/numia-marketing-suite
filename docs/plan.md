# Stream of Consciousness → Typefully Posts (Simplified)

**The Problem:** You have ideas. They need to become polished LinkedIn/Twitter posts with images in Typefully.

**The Solution:** 5 steps. No complexity.

---

## THE WORKFLOW

```
1. User dumps thoughts → /linkedin or /twitter
2. Claude reads guidelines, drafts posts, adds [IMG:CODENAME] placeholders
3. Claude saves to output/linkedin/YYYY-MM-DD.md (or twitter/)
4. User creates images in frontend, exports to output/images/CODENAME.png
5. User runs: python scripts/sync_typefully.py output/linkedin/YYYY-MM-DD.md
   → Script parses markdown, matches images, POSTs to Typefully
```

Done.

---

## PHASE 1: INPUT

### User Dumps Stream of Consciousness
```bash
/linkedin Hey I was thinking about how we hit 5B monthly API requests and most teams are still juggling 3 different providers and dealing with stale data...
```

Or:
```bash
/twitter Wild that everyone normalizes refreshing dashboards 5 times to see if the number is real...
```

**No structure required.** Just brain dump.

---

## PHASE 2: CLAUDE PROCESSING

### What Claude Does

**CRITICAL: Claude reads the guidelines skill FIRST**

Before drafting any post, Claude MUST read and internalize:
- `intelligence/post-guidelines/linkedin-guidelines.md` (for /linkedin)
- `intelligence/post-guidelines/twitter-guidelines.md` (for /twitter)
- `intelligence/post-guidelines/blog-guidelines.md` (for /blog)

These files contain the **complete playbook** for writing posts that:
- Sound human, not AI
- Follow platform-specific best practices
- Use the right voice, tone, structure
- Include proper formatting and white space

**Then Claude:**

1. **Analyzes** the stream of consciousness
2. **Extracts** 1-5 post-worthy insights
3. **Drafts each post** following the guidelines religiously
4. **Identifies** which posts need images (data posts = always, frameworks = yes, stories = optional)
5. **Adds** `[IMG:CODENAME]` placeholders with specs
6. **Saves** to `output/linkedin/YYYY-MM-DD.md` (or `twitter/` or `blog/`)

**Post Classification (Claude figures out):**
- Story posts (personal anecdotes)
- Data posts (metrics, trends - ALWAYS need image)
- Framework posts ("3 ways to..." - need image)
- Contrarian takes (challenge norms)
- Behind-the-scenes (process/journey - need image)

**Voice:**
- LinkedIn: Peer-to-peer, empathetic, technical but conversational
- Twitter: More casual, hot takes allowed, fragments/run-ons
- Blog: Deep, educational, authoritative

---

## PHASE 3: IMAGE ORCHESTRATION

### Codename System

When a post needs an image, Claude adds:

```markdown
[IMG:NUMIA-5B-API-REQUESTS]
// Image specs:
// - Type: Stat card
// - Text: "5B+" in large bold font
// - Subtext: "Monthly API requests"
// - Style: Dark background, brand colors (purple/blue)
// - Dimensions: 1200x675 (optimal for LinkedIn/Twitter)
```

**Naming Convention:**
- `PREFIX-CORE-DESCRIPTION`
- Example: `NUMIA-5B-API-REQUESTS`
- All caps, hyphen-separated, max 50 chars
- Descriptive enough that you know exactly what to create

**When Images Are Needed:**
- Data posts → ALWAYS
- Framework posts → ALWAYS
- Behind-the-scenes → ALWAYS
- Story posts → Optional
- Contrarian takes → Optional

---

## PHASE 4: USER CREATES IMAGES

### Workflow

1. **Review** the drafted posts in `output/linkedin/YYYY-MM-DD.md`
2. **Open** the frontend Perfect Shot tool
3. **Create** each image following the specs
4. **Title** the image with the EXACT codename: `NUMIA-5B-API-REQUESTS`
5. **Export** to `output/images/NUMIA-5B-API-REQUESTS.png`

**Critical:** The filename MUST match the codename exactly. No creativity here.

```
output/images/
├── NUMIA-5B-API-REQUESTS.png
├── WEB3-DATA-CLOUD-EVOLUTION.png
└── COSMOS-RPC-ARCHITECTURE.png
```

---

## PHASE 5: SYNC TO TYPEFULLY

### The Script

**File:** `scripts/sync_typefully.py`

**What it does (30 lines of Python):**

1. **Parses** the markdown file to extract posts
2. **Finds** `[IMG:CODENAME]` placeholders
3. **Looks** for `output/images/CODENAME.png`
4. **Uploads** image to CDN (or base64 encodes)
5. **POSTs** to Typefully API:
   ```json
   {
     "content": "post text here",
     "platforms": ["linkedin"],
     "media": [{"url": "https://cdn.../image.png"}],
     "status": "draft"
   }
   ```

**Usage:**
```bash
python scripts/sync_typefully.py output/linkedin/2025-01-12.md
```

**Output:**
```
✓ Found 3 posts
✓ Matched 2 images, 1 pending
✓ Pushed 3 posts to Typefully (2 with images)

Pending images:
- NUMIA-DASHBOARD-DEMO.png
```

### Pseudocode

```python
import sys, re, requests
from pathlib import Path

def parse_markdown(file):
    """Extract posts from markdown file"""
    # Split by "---\nPOST" or "---\nTHREAD"
    # Return list of {title, content, img_codename}

def match_image(codename):
    """Find image file by codename"""
    img_path = Path(f"output/images/{codename}.png")
    if img_path.exists():
        return upload_to_cdn(img_path)  # or base64 encode
    return None

def push_to_typefully(post, image_url):
    """POST to Typefully API"""
    requests.post('https://api.typefully.com/v1/drafts',
        headers={'Authorization': f'Bearer {API_KEY}'},
        json={
            'content': post['content'],
            'platforms': ['linkedin'],  # or ['twitter']
            'media': [image_url] if image_url else [],
            'status': 'draft'
        })

def main(markdown_file):
    posts = parse_markdown(markdown_file)

    for post in posts:
        img_url = match_image(post['img_codename']) if post['img_codename'] else None
        push_to_typefully(post, img_url)

    print(f"✓ Pushed {len(posts)} posts to Typefully")

if __name__ == "__main__":
    main(sys.argv[1])
```

That's it. No state tracking. No browser automation. No JSON files.

---

## FILE STRUCTURE

```
b2b-marketing-ai/
├── .claude/
│   └── commands/
│       ├── linkedin.md          # /linkedin slash command
│       ├── twitter.md           # /twitter slash command
│       └── blog.md              # /blog slash command
│
├── intelligence/
│   └── post-guidelines/
│       ├── linkedin-guidelines.md   # LinkedIn writing skill
│       ├── twitter-guidelines.md    # Twitter writing skill
│       └── blog-guidelines.md       # Blog writing skill
│
├── output/
│   ├── linkedin/
│   │   ├── 2025-01-12.md       # Claude-generated posts
│   │   └── 2025-01-13.md
│   ├── twitter/
│   │   └── 2025-01-12.md
│   └── images/
│       ├── NUMIA-5B-API-REQUESTS.png
│       └── WEB3-CLOUD-EVOLUTION.png
│
└── scripts/
    └── sync_typefully.py        # 30 lines: parse → match → push
```

**No:**
- `pending_images.json`
- `published_posts.json`
- State tracking files
- localStorage queries
- Browser automation

**Why?** Typefully already tracks what's scheduled/published. Query their API if you need that data.

---

## OUTPUT FORMAT

### LinkedIn Post Example

```markdown
---
POST 1/3: The 5B API Request Milestone
---

You just refreshed your dashboard 5 times.

Not because you're impatient.

Because you literally can't tell if the token balance is real or if your data provider is lagging again.

This is what happens when you're duct-taping together three different providers. Sound familiar?

How many providers are you juggling right now? Be honest.

Here's what changes: One API. Every chain. Same response time. No more "which provider is lying today" detective work. It's about confidence in your infrastructure.

That's Numia. It's not just data; it's peace of mind.

[IMG:NUMIA-5B-API-REQUESTS]
// Image specs:
// - Type: Stat card
// - Text: "5B+" in large bold font
// - Subtext: "Monthly API requests"
// - Style: Dark background, Numia brand colors
// - Dimensions: 1200x675

---
```

### Twitter Thread Example

```markdown
---
THREAD 1/2: Data Provider Reality Check
---

Tweet 1:
Wild that we normalize infrastructure that makes you refresh 5 times to see if the number's real

Tweet 2:
Here's what's actually happening:

Your provider pulls from multiple nodes.

When one lags, your entire query lags.

But you have zero visibility into which node is slow.

So you just... refresh and hope.

Tweet 3:
Three signs your provider is lying:

→ Balances don't match Etherscan
→ Data randomly stops updating
→ You refresh more than you code

If all three... it's time to switch.

Tweet 4:
We built Numia because we were tired of this.

One source of truth. 50+ chains. No surprises.

That's it.

Tweet 5:
What's your current setup? Alchemy + QuickNode + prayer?

Be honest.

[IMG:NUMIA-PROVIDER-COMPARISON]
// Image specs:
// - Type: Comparison chart
// - Left: "Multi-provider chaos" (3 logos with X marks)
// - Right: "Numia" (checkmarks)
// - Style: Dark background, clean layout
// - Dimensions: 1200x675

---
Thread Length: 5 tweets
---
```

---

## ERROR HANDLING

### Missing Images

If `output/images/CODENAME.png` doesn't exist:
- Script pushes post to Typefully WITHOUT image
- Adds to "Pending images" list in output
- User creates image later, re-runs script

**The script is idempotent.** Run it multiple times safely. Typefully API handles duplicates.

### Duplicate Codenames

If user accidentally creates two images with same name:
- Filesystem overwrites (latest wins)
- No ambiguity

### Malformed Markdown

If Claude's output is malformed:
- Script fails with clear error: "Could not parse POST 2/3"
- User fixes markdown manually or re-runs /linkedin

**Simple errors. Simple fixes.**

---

## LINKEDIN GUIDELINES SKILL (KEY PRINCIPLES)

Claude MUST follow these when drafting LinkedIn posts:

### Sound Human, Not AI
- ✅ Break grammar rules (start with "And," "But," "So")
- ✅ Use fragments: "Like this. See?"
- ✅ Vary sentence length: Long explanatory followed by short punchy
- ✅ Contractions: don't, you're, it's, we've
- ✅ Conversational phrases: "Here's the thing," "Look," "Real talk"
- ❌ "In today's rapidly evolving landscape..."
- ❌ "Moreover," "Furthermore," "Additionally"
- ❌ Perfect templated structure

### Structure (100-150 words MAX)
1. **Hook** (77 chars max): Hyper-specific painful scenario
2. **Root cause** + validation phrase ("Sound familiar?")
3. **Engagement question** + prompt ("Be honest.")
4. **Tangible benefits** + "It's about..." emotional reframe
5. **Numia mention** + emotional payoff

**Example:**
```
You just spent 6 hours debugging. [Pain]

The code's fine. But Polygon is 90 seconds behind. [Root cause]

Sound familiar? [Validation]

How many providers are you juggling? Be honest. [Engagement]

One API. Every chain. No detective work. It's about confidence. [Benefits]

That's Numia. It's your Tuesday back. [Emotional close]
```

### White Space = CRITICAL
- Paragraph breaks after almost EVERY sentence
- 8-12+ breaks minimum
- Dense paragraphs = instant scroll-past
- Mobile users need scannable content

### Hook Patterns (Vary These)
- Bold claim: "Your data provider is lying to you."
- Relatable pain: "3am. Your dashboard is broken. Again."
- Provocative question: "Why does Etherscan show different numbers?"
- Specific stat: "60-second data lag costs you customers."
- Pattern interrupt: "Your code isn't broken. Your provider is."

**DO NOT use the same hook pattern repeatedly.** AI tell.

### Tangible Benefits (Not Abstract)
- ❌ "Real-time data" (abstract)
- ❌ "Better infrastructure" (abstract)
- ✅ "One API instead of juggling 3 providers" (tangible)
- ✅ "Debug in 5 minutes instead of 5 hours" (tangible)
- ✅ "Sleep through the night instead of wake to alerts" (tangible)

### Emotional Close (MANDATORY)
Never end with just "That's Numia."

Always add emotional payoff:
- "That's Numia. It's not just data; it's peace of mind."
- "That's Numia. It's not just an API; it's your weekend back."
- "That's Numia. So you can sleep through the night."

**Full guidelines:** `intelligence/post-guidelines/linkedin-guidelines.md`

---

## TWITTER GUIDELINES SKILL (KEY PRINCIPLES)

Claude MUST follow these when drafting Twitter threads:

### Sound Human, Not AI
- ✅ Break ALL rules: Fragments. Run-ons. Whatever works.
- ✅ Casual language: "tbh," "ngl," "lol" (if authentic)
- ✅ Hot takes, humor, frustration
- ✅ More casual than LinkedIn
- ❌ Corporate speak
- ❌ "Moreover," "Furthermore"
- ❌ Playing it safe

### Thread Structure (5-12 tweets, sweet spot 7-9)
1. **Hook Tweet**: MUST stop the scroll (bold claim, stat, controversy)
2. **Body Tweets**: One idea per tweet, build momentum
3. **Final Tweet**: Specific engagement question

**Each tweet must be self-contained.** Readable even if you only see that tweet.

### Hook Tweet = Everything
If first tweet doesn't hook, thread dies.

**Good hooks:**
- "Wild that we normalize infrastructure that makes you refresh 5 times"
- "Your code isn't broken. Your provider is."
- "We analyzed 847 dApps. 73% are showing stale data."

**Bad hooks:**
- "🧵 Thread on blockchain data infrastructure" (boring)
- "Let me tell you about..." (too much setup)

### Transitions (Not "Moreover")
- "Here's the thing—"
- "But wait—"
- "So."
- "Real talk:"
- "The kicker?"
- No transition (just continue)

### Line Breaks = Readability
Use strategic white space:
```
Three signs your provider is lying:

→ Balances don't match Etherscan
→ Data randomly stops updating
→ You refresh more than you code

If all three... it's time to switch.
```

### Engagement Question (Final Tweet)
Make it specific:
- ✅ "What's your setup? Alchemy + QuickNode + prayer?"
- ✅ "Which one hit hardest? Be honest."
- ❌ "What do you think?" (generic)

**Full guidelines:** `intelligence/post-guidelines/twitter-guidelines.md`

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Slash Commands ✓
- [x] Create `/linkedin` in `.claude/commands/linkedin.md`
- [x] Create `/twitter` in `.claude/commands/twitter.md`
- [ ] Create `/blog` in `.claude/commands/blog.md`

### Phase 2: Guidelines Skills ✓
- [x] `intelligence/post-guidelines/linkedin-guidelines.md` exists
- [x] `intelligence/post-guidelines/twitter-guidelines.md` exists
- [x] Each slash command references its guideline skill

### Phase 3: File Structure
- [ ] Create `output/linkedin/` directory
- [ ] Create `output/twitter/` directory
- [ ] Create `output/blog/` directory
- [ ] Create `output/images/` directory

### Phase 4: Sync Script
- [ ] Create `scripts/sync_typefully.py`
- [ ] Implement markdown parser
- [ ] Implement image matcher
- [ ] Implement Typefully API integration
- [ ] Add error handling (missing images, malformed markdown)
- [ ] Test with sample posts

### Phase 5: Frontend Integration
- [ ] Update Perfect Shot export to save to `output/images/`
- [ ] Add filename validation (must match codename format)
- [ ] Show pending image list from markdown files

---

## WHY THIS WORKS

**Before (Complex):**
- 500+ lines of Python
- Browser automation (Playwright)
- 3 JSON state files
- localStorage queries
- 10 phases of orchestration

**After (Simple):**
- 30 lines of Python
- File I/O only
- No state files
- Filesystem queries
- 5 steps total

**Same result. 90% less complexity.**

The best code is code you don't write.

---

## NEXT STEPS

1. Create directory structure: `output/{linkedin,twitter,blog,images}/`
2. Write `scripts/sync_typefully.py` (30 lines)
3. Test workflow:
   - Run `/linkedin Hey we hit 5B API requests...`
   - Review `output/linkedin/2025-01-12.md`
   - Create images in Perfect Shot
   - Export to `output/images/`
   - Run `python scripts/sync_typefully.py output/linkedin/2025-01-12.md`
   - Check Typefully drafts

4. Iterate based on real usage

---

**This plan is foolproof. No over-engineering. No feature creep. Just: thought → Claude → image → Typefully.**

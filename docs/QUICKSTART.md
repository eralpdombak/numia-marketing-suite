# Quick Start - Stream to Typefully

## What This Does

Dump your thoughts → Claude writes LinkedIn/Twitter posts → You create images → Posts go to Typefully

Simple. No BS.

---

## Setup (2 minutes)

### 1. Install Python Package

```bash
pip install requests python-dotenv
```

### 2. Get Typefully API Key

Go to https://typefully.com/settings/api and copy your API key.

### 3. Create `.env` File

```bash
cp .env.example .env
```

Then edit `.env` and paste your Typefully key:
```
TYPEFULLY_API_KEY=your_actual_key_here
```

**Done.** That's it.

---

## Usage

### Generate LinkedIn Posts

```bash
/linkedin Hey we just hit 5B monthly API requests and most teams are still juggling 3 different data providers dealing with stale data...
```

Claude will:
- Read the LinkedIn guidelines
- Draft posts
- Save to `output/linkedin/2025-01-12.md`
- Add `[IMG:CODENAME]` placeholders

### Generate Twitter Threads

```bash
/twitter Wild that we normalize infrastructure that makes you refresh 5 times to see if the number is real...
```

Same process, saved to `output/twitter/2025-01-12.md`

### Create Images

1. Open Perfect Shot tool
2. Look at the `[IMG:CODENAME]` specs in the markdown
3. Create each image
4. Save with EXACT codename: `NUMIA-5B-API-REQUESTS.png`
5. Export to `output/images/`

### Push to Typefully

```bash
python scripts/sync_typefully.py output/linkedin/2025-01-12.md
```

Output:
```
✓ Found 3 posts
✓ Matched 2 images, 1 pending
✓ Pushed 3 posts to Typefully (2 with images)

Pending images:
- NUMIA-DASHBOARD-DEMO.png
```

**If images are pending:** Create them, then re-run the script.

---

## That's It

The workflow:
1. `/linkedin` or `/twitter` with your thoughts
2. Review the markdown in `output/`
3. Create images in Perfect Shot
4. Export to `output/images/`
5. Run `python scripts/sync_typefully.py output/linkedin/YYYY-MM-DD.md`
6. Go to Typefully, review, schedule

---

## Troubleshooting

### "TYPEFULLY_API_KEY not found"
- Check `.env` exists (not `.env.example`)
- Check the key is in there

### "Image pending"
- Create it in Perfect Shot
- Export with exact codename
- Re-run sync script

### "No posts found"
- Check the markdown file exists
- Claude should format it automatically with `---\nPOST 1/3:`

---

## File Structure

```
output/
├── linkedin/2025-01-12.md  ← Claude saves here
├── twitter/2025-01-12.md
└── images/
    ├── NUMIA-5B-API-REQUESTS.png  ← You export here
    └── WEB3-CLOUD-EVOLUTION.png

scripts/
└── sync_typefully.py  ← Run this to push to Typefully
```

---

## Examples

See `plan.md` for:
- Full LinkedIn post example
- Full Twitter thread example
- Complete guidelines

---

**That's the whole system. Go make content.**

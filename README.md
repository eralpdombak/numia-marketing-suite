# B2B Marketing AI

Numia's AI-powered marketing content generator.

## Quick Start

```bash
# 1. Create virtual environment and install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Set up API keys
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY and OPENAI_API_KEY

# 3. Generate content
python3 main.py linkedin "your topic"
```

## Marketing Context System

B2B Marketing AI uses a comprehensive brand memory system to ensure all content is on-brand, compliant, and high-quality.

### For AI Agent Setup
The system automatically loads:
1. **Brand identity** - Voice, tone, visual guidelines
2. **Audience insights** - Customer profiles, platforms, priorities
3. **Products catalog** - Features, pricing, use cases
4. **Messaging framework** - Themes, narratives, objections
5. **Competitive intel** - Differentiation, competitor tracking
6. **Compliance rules** - Legal requirements, regional regulations
7. **Performance data** - Proven campaign patterns, examples

**Location:** All brand context lives in `memory/numia_brand.md`

### For Manual Use
Before creating content:
- Review `memory/numia_brand.md` for voice and tone guidelines
- Check product details and pricing
- Reference examples section for quality standards
- Verify compliance requirements (especially securities language)

### Key Company Facts
- **Company:** Numia.xyz
- **Founded:** 2021
- **Scale:** 100+ blockchains, 5B+ monthly API requests
- **Products:** Data APIs, Chain Dashboards, Numia Engage, Data Warehouse, Alert System
- **Target:** L1/L2 teams, developers, ecosystem growth leads

### Content Guidelines Summary
1. **Sound human, not AI** - Use contractions, break grammar rules, add personality
2. **Be specific** - Real numbers, not vague claims (47ms latency, not "fast")
3. **Show, don't tell** - Examples over concepts
4. **Lead with data** - Performance metrics first
5. **No banned words** - Avoid "leverage", "seamless", "robust", etc.

### Maintenance Schedule
- **Weekly:** Update performance metrics in brand memory
- **Monthly:** Refresh competitive intelligence via monitoring
- **Quarterly:** Review audience insights
- **Annually:** Revise brand guidelines

### Content Learning System

B2B Marketing AI tracks every piece of content you generate to:
- Prevent duplicate topics
- Track what's been created (timestamp, type, word count)
- Build a searchable history
- Show generation statistics

**View your content history:**
```bash
python3 content_stats.py                    # View stats and recent content
python3 content_stats.py search reorgs      # Search by keyword
```

All tracking data is stored in `content_log.json` (gitignored for privacy).

---

## Usage

### Content Generation Commands

**Blog Post** (1500 words, technical, SEO-optimized)
```bash
python3 main.py blog "your topic"
python3 main.py blog "your topic" --perspectives investor,crypto-expert
```

**Twitter Thread** (10 tweets, engaging format)
```bash
python3 main.py thread "your topic"
python3 main.py thread "your topic" --perspectives developer,business
```

**Newsletter** (800-1000 words, email format with subject line)
```bash
python3 main.py newsletter "your topic"
python3 main.py newsletter "your topic" --perspectives researcher
```

**LinkedIn Post** (100-120 words, professional, no hashtags)
```bash
python3 main.py linkedin "your topic"
python3 main.py linkedin "your topic" --perspectives business,investor
```

**Short Video Script** (60 seconds for TikTok/Reels/Shorts)
```bash
python3 main.py short-video "your topic"
python3 main.py short-video "your topic" --perspectives developer
```

**Demo Video Script** (3-5 minutes, product walkthrough)
```bash
python3 main.py demo-video "your topic"
python3 main.py demo-video "your topic" --perspectives crypto-expert,developer
```

**Auto-Generate Topic** (AI generates relevant topic + research)
```bash
python3 main.py blog  # No topic = auto-generates one
```

### Output Locations
- Blog Posts: `output/blogs/`
- Twitter Threads: `output/threads/`
- Newsletters: `output/newsletters/`
- LinkedIn Posts: `output/linkedin/`
- Instagram Posts: `output/instagram/`

## Multi-Perspective Generation

Generate content from different viewpoints using the `--perspectives` flag. Each perspective shapes the content's angle and focus.

### Available Perspectives

- **investor** - VC/fund manager evaluating market opportunity, competitive positioning, ROI
- **crypto-expert** - Deep technical analysis of protocols, consensus, cryptographic primitives
- **developer** - Practical implementation, code examples, debugging, real-world gotchas
- **business** - ROI focus, team productivity, cost analysis, business impact
- **researcher** - Academic foundations, theoretical tradeoffs, research directions

### Usage Examples

**Single perspective:**
```bash
python3 main.py blog "cross-chain data consistency" --perspectives investor
```

**Multiple perspectives:**
```bash
python3 main.py blog "cross-chain data consistency" --perspectives investor,crypto-expert,developer
```

This generates 3 blog posts:
- `output/blogs/2025-10-14_cross-chain_data_consistency_investor.md`
- `output/blogs/2025-10-14_cross-chain_data_consistency_crypto-expert.md`
- `output/blogs/2025-10-14_cross-chain_data_consistency_developer.md`

**How it works:**
1. Each perspective adds specialized guidelines to the generation prompt
2. Content maintains Numia's brand voice but focuses on perspective-specific concerns
3. Files are named with perspective suffixes for easy identification

**When to use perspectives:**
- Investor: Pitches, market analysis, competitive positioning
- Crypto Expert: Protocol deep dives, technical architecture, security analysis
- Developer: Tutorials, integration guides, troubleshooting
- Business: ROI analysis, team efficiency, vendor comparisons
- Researcher: Academic content, theoretical foundations, research summaries

## Project Structure

```
b2b-marketing-ai/
├── intelligence/        # Competitive intelligence system
│   ├── scrapers/        # Data collection modules
│   ├── data/            # Saved intelligence
│   └── config.yaml      # Competitor profiles
├── memory/              # Brand voice, perspectives & research
│   ├── perspectives/    # Content perspectives (investor, developer, etc.)
│   ├── post-guidelines/ # Content type guidelines
│   └── research/        # Research materials & reference docs
├── output/              # Generated content
│   ├── blogs/
│   ├── instagram/
│   ├── linkedin/
│   ├── newsletters/
│   └── threads/
├── src/                 # Source code
├── main.py              # Main CLI
└── intel.py             # Intelligence CLI
```

## Competitive Intelligence

### On-Demand Intelligence
Ask questions about competitors and get instant intelligence reports. See [`intelligence/README.md`](intelligence/README.md) for full docs.

```bash
# Ask any competitive question
python3 intel.py query "What are Dune's main weaknesses?"

# Get competitor profile
python3 intel.py profile dune

# Feature gap analysis
python3 intel.py gaps

# Pricing intelligence
python3 intel.py pricing

# Daily digest
python3 intel.py digest
```

### Real-Time Monitoring
Automated tracking of competitor activity. See [`intelligence/MONITORING.md`](intelligence/MONITORING.md) for full docs.

```bash
# Run single scan
python3 monitor.py scan

# Start continuous monitoring
python3 monitor.py start

# View alerts
python3 monitor.py alerts
```

**Monitors:**
- 📰 RSS feeds (blogs)
- 🐦 Twitter activity
- 🔧 GitHub repos
- 💲 Pricing pages

**Tracked Competitors:** Dune, Nansen, Flipside, The Graph, Messari

---

## Version & Maintenance

**Version:** 1.0.0
**Last Updated:** 2025-10-21
**Next Review:** Quarterly

This project is proprietary to Numia. Handle with appropriate security.

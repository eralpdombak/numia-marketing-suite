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
# Edit .env and add your ANTHROPIC_API_KEY

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

### Content Tracking

B2B Marketing AI automatically tracks every piece of content you generate (timestamp, type, word count) in `content_log.json` for your records.

---

## Usage

### Content Generation Commands

**Blog Post** (Technical, SEO-optimized, natural length)
```bash
python3 main.py blog "your topic"
python3 main.py blog "your topic" --perspectives investor,crypto-expert
```

**Twitter Thread** (Natural length based on topic, 5-15 tweets)
```bash
python3 main.py thread "your topic"
python3 main.py thread "your topic" --perspectives developer,business
```

**Newsletter** (Email format with subject line, natural length)
```bash
python3 main.py newsletter "your topic"
python3 main.py newsletter "your topic" --perspectives researcher
```

**LinkedIn Post** (Professional, natural length 80-200 words)
```bash
python3 main.py linkedin "your topic"
python3 main.py linkedin "your topic" --perspectives business,investor
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

## Multi-Perspective Enrichment

Enrich content with insights from multiple perspectives using the `--perspectives` flag. This creates ONE comprehensive piece that incorporates viewpoints from different audiences.

### Available Perspectives

- **investor** - VC/fund manager evaluating market opportunity, competitive positioning, ROI
- **crypto-expert** - Deep technical analysis of protocols, consensus, cryptographic primitives
- **developer** - Practical implementation, code examples, debugging, real-world gotchas
- **business** - ROI focus, team productivity, cost analysis, business impact
- **researcher** - Academic foundations, theoretical tradeoffs, research directions

### Usage Examples

**Single perspective:**
```bash
python3 main.py blog "cross-chain data consistency" --perspectives developer
```
→ Creates 1 blog post with developer-focused insights

**Multiple perspectives combined:**
```bash
python3 main.py blog "cross-chain data consistency" --perspectives investor,crypto-expert,developer
```
→ Creates 1 comprehensive blog post that includes:
- Technical implementation details (developer)
- Protocol-level analysis (crypto-expert)
- Market opportunity insights (investor)

**Output:**
- `output/blogs/2025-10-23_cross-chain_data_consistency.md` (single file with all perspectives blended)

**How it works:**
1. All specified perspectives are loaded as context
2. The AI incorporates insights from each perspective into a single cohesive piece
3. Content maintains Numia's brand voice while addressing multiple audience concerns

**When to use perspectives:**
- Investor: Add market analysis and business value
- Crypto Expert: Add deep technical protocol details
- Developer: Add practical implementation guidance
- Business: Add ROI and productivity insights
- Researcher: Add theoretical foundations and academic context

## Project Structure

```
b2b-marketing-ai/
├── memory/              # Brand voice, perspectives & research
│   ├── perspectives/    # Content perspectives (investor, developer, etc.)
│   ├── post-guidelines/ # Content type guidelines
│   └── research/        # Research materials & reference docs
├── output/              # Generated content
│   ├── blogs/
│   ├── linkedin/
│   ├── newsletters/
│   └── threads/
├── src/                 # Source code
└── main.py              # Main CLI
```

---

## Version & Maintenance

**Version:** 1.0.0
**Last Updated:** 2025-10-21
**Next Review:** Quarterly

This project is proprietary to Numia. Handle with appropriate security.

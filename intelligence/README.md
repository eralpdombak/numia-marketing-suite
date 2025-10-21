# Competitive Intelligence System

On-demand research and analysis for Numia's competitive landscape.

## Overview

This system provides instant answers to competitive intelligence questions without requiring active data scraping. Ask questions, get detailed reports powered by AI analysis of competitor profiles.

## Quick Start

```bash
# Ask any competitive question
python intel.py query "What are Dune's main weaknesses?"

# Get competitor profile
python intel.py profile dune

# Feature gap analysis
python intel.py gaps

# Pricing intelligence
python intel.py pricing

# Predict competitor moves
python intel.py predict nansen

# Customer intelligence
python intel.py customers

# Daily digest (simulated)
python intel.py digest

# GitHub repo analysis
python intel.py github duneanalytics/spellbook
```

## Available Commands

### 1. **Query** - Ask Anything
```bash
python intel.py query "How does Numia compare to The Graph?"
python intel.py query "What would make customers switch from Dune to Numia?"
python intel.py query "Who are Flipside's target customers?"
```

### 2. **Competitor Profiles**
```bash
python intel.py profile dune
python intel.py profile nansen
python intel.py profile "the graph"
```

Get detailed analysis:
- Company overview
- Key products/features
- Strengths vs Numia
- Weaknesses vs Numia
- Recommended positioning

### 3. **Feature Gap Analysis**
```bash
python intel.py gaps
```

Analyzes:
- Features competitors have that Numia doesn't
- Features Numia has that competitors don't
- Parity features (table stakes)
- Roadmap priorities

### 4. **Pricing Intelligence**
```bash
python intel.py pricing
```

Provides:
- Estimated competitor pricing tiers
- Pricing model analysis
- Positioning recommendations
- Numia pricing strategy

### 5. **Predictive Analysis**
```bash
python intel.py predict dune
python intel.py predict "the graph"
```

Predicts:
- Likely product features they'll build
- Market segments they'll target
- Pricing changes
- Partnership targets
- Timeline and probability

### 6. **Customer Intelligence**
```bash
python intel.py customers
```

Analyzes:
- Customer segmentation by competitor
- Switching triggers
- Numia's ideal customer profile
- Target account strategies

### 7. **Response Generator**
```bash
python intel.py respond "Dune just launched real-time data streaming"
```

Generates:
- Twitter thread response
- LinkedIn post
- Blog post outline

### 8. **GitHub Monitoring**
```bash
python intel.py github duneanalytics/spellbook
python intel.py github graphprotocol/graph-node
```

Analyzes:
- Repository activity
- Recent releases
- Open issues
- Commit frequency

### 9. **Daily Digest**
```bash
python intel.py digest
```

Generates:
- High priority alerts
- Recent competitor content
- Social signals
- Product updates
- Recommended actions

## Tracked Competitors

- **Dune Analytics** - SQL-based blockchain analytics
- **Nansen** - Smart money tracking, wallet analytics
- **Flipside Crypto** - Incentivized analytics, bounty programs
- **The Graph** - Decentralized indexing protocol
- **Messari** - Crypto research, market intelligence

## Configuration

Edit `intelligence/config.yaml` to:
- Add/remove competitors
- Update competitor profiles
- Adjust alert priorities
- Modify Numia's positioning

## Architecture

```
intelligence/
├── config.yaml              # Competitor profiles & settings
├── intel_engine.py          # Main intelligence engine
├── scrapers/                # Data collection (GitHub, web, social)
│   └── github_monitor.py    # GitHub repo analysis
├── analyzers/               # AI-powered analysis
├── alerts/                  # Alert rules & notifications
├── responders/              # Auto-generate responses
└── data/                    # Saved intelligence queries
```

## How It Works

**No Active Scraping (Yet)**
- System uses AI + configured competitor profiles
- When you ask a question, AI analyzes based on known context
- Responses are informed estimates, not live data

**Future: Live Data Collection**
- Can activate scrapers to monitor in real-time
- RSS feeds, Twitter, GitHub, pricing pages
- Automatic alerts when competitors make moves

## Integration with Content Generation

Generate competitive content:

```python
from intelligence.intel_engine import IntelligenceEngine

intel = IntelligenceEngine()

# Get competitive angle
report = intel.query("What makes Numia better than Dune for Cosmos developers?")

# Use in content generation
# → Feed to main.py for blog post, LinkedIn post, etc.
```

## Example Workflows

**Scenario: Competitor launches new feature**
```bash
# 1. Understand the move
python intel.py query "What does Dune's new real-time feature mean for Numia?"

# 2. Generate response content
python intel.py respond "Dune launched real-time data streaming"

# 3. Create marketing content
python main.py linkedin "Why real-time Cosmos data matters"
```

**Scenario: Planning product roadmap**
```bash
# 1. Analyze feature gaps
python intel.py gaps

# 2. Predict competitor moves
python intel.py predict dune
python intel.py predict nansen

# 3. Prioritize based on intelligence
# → Use insights to inform product decisions
```

**Scenario: Sales enablement**
```bash
# 1. Get battlecards
python intel.py profile dune

# 2. Understand customer switching triggers
python intel.py customers

# 3. Generate positioning
python intel.py query "Why would a Dune customer switch to Numia?"
```

## Advanced Usage

### Python API

```python
from intelligence.intel_engine import IntelligenceEngine

intel = IntelligenceEngine()

# Custom queries
report = intel.query("Specific question here", category="product")

# Competitor analysis
profile = intel.competitor_profile("dune")

# Feature gaps
gaps = intel.feature_gap_analysis()

# Pricing
pricing = intel.pricing_analysis()

# Predictions
predictions = intel.predict_competitor_moves("nansen")

# Customer intel
customers = intel.customer_intel()

# Response content
response = intel.generate_response_content("Competitor action")
```

### GitHub Monitoring

```python
from intelligence.scrapers.github_monitor import GitHubMonitor

monitor = GitHubMonitor()

# Analyze single repo
analysis = monitor.analyze_repo("duneanalytics/spellbook")

# Compare repos
comparison = monitor.compare_repos([
    "duneanalytics/spellbook",
    "graphprotocol/graph-node",
    "FlipsideCrypto/sql_models"
])
```

## Data Storage

All queries and analyses are saved to `intelligence/data/`:
```
intelligence/data/
├── intel_2025-10-19_14-30-00.json   # Saved queries
├── intel_2025-10-19_15-45-00.json
└── github/
    ├── duneanalytics_spellbook_2025-10-19.json
    └── graphprotocol_graph-node_2025-10-19.json
```

Review past intelligence:
```bash
ls intelligence/data/
cat intelligence/data/intel_*.json | jq .
```

## Future Enhancements

**When you're ready to activate live monitoring:**

1. **Automated Scraping**
   - Daily RSS feed monitoring
   - Twitter API tracking
   - Pricing page snapshots
   - GitHub webhooks

2. **Real-time Alerts**
   - Slack notifications
   - Email digests
   - Priority-based routing

3. **Trend Analysis**
   - Historical tracking
   - Sentiment analysis
   - Market momentum

4. **Competitive Dashboards**
   - Visual analytics
   - Comparison charts
   - Timeline views

## Notes

- **Privacy**: Respects public data only
- **Rate Limits**: GitHub API has limits (60 req/hour without token, 5000 with)
- **Accuracy**: AI estimates based on available data, not guaranteed facts
- **Updates**: Refresh competitor profiles in config.yaml as you learn more

## Questions?

Ask the intelligence engine:
```bash
python intel.py query "How does this intelligence system work?"
```

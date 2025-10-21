# Intelligence System Examples

## Quick Examples

### 1. Ask About Competitor Weaknesses
```bash
python intel.py query "What are Dune Analytics' main weaknesses that Numia can exploit?"
```

### 2. Understand Customer Switching Triggers
```bash
python intel.py query "What would make a developer switch from Dune to Numia?"
```

### 3. Position Against The Graph
```bash
python intel.py query "How should Numia position against The Graph for Cosmos developers?"
```

### 4. Feature Comparison
```bash
python intel.py query "Compare Numia's real-time data sync to competitors"
```

### 5. Pricing Strategy
```bash
python intel.py query "Should Numia price higher or lower than Dune? Why?"
```

## Competitive Response Scenarios

### Scenario 1: Competitor Launches Feature
```bash
# Research the impact
python intel.py query "Flipside just launched automated alerts. How does this affect Numia?"

# Generate response content
python intel.py respond "Flipside Crypto launched automated on-chain alerts"

# Create marketing content
python main.py twitter "Why Numia's alert system is built for Cosmos"
```

### Scenario 2: Competitor Raises Funding
```bash
# Analyze implications
python intel.py query "Nansen raised $75M Series B. What will they build? Should Numia be worried?"

# Predict next moves
python intel.py predict nansen

# Prepare positioning
python intel.py query "How to position Numia as efficient vs VC-funded competitors?"
```

### Scenario 3: Customer Complaint About Competitor
```bash
# Research the pain point
python intel.py query "Developers complain that Dune queries are too slow. How does Numia compare?"

# Generate response
python intel.py respond "Multiple developers complaining about Dune query performance on Twitter"

# Create comparison content
python main.py linkedin "Query performance matters in blockchain analytics"
```

## Sales & Marketing Workflows

### Create Battlecards
```bash
# For each competitor
python intel.py profile dune > docs/battlecard-dune.md
python intel.py profile nansen > docs/battlecard-nansen.md
python intel.py profile flipside > docs/battlecard-flipside.md
```

### Identify Target Customers
```bash
# Understand who to target
python intel.py customers

# Find switching triggers
python intel.py query "What makes companies switch blockchain data providers?"

# Create ICP
python intel.py query "Who is Numia's ideal customer vs Dune's ideal customer?"
```

### Plan Product Roadmap
```bash
# Understand gaps
python intel.py gaps

# Predict competition
python intel.py predict dune
python intel.py predict "the graph"

# Prioritize features
python intel.py query "Which features would give Numia the biggest competitive advantage?"
```

## GitHub Intelligence

### Monitor Competitor Development
```bash
# Check Dune's activity
python intel.py github duneanalytics/spellbook

# Track The Graph
python intel.py github graphprotocol/graph-node

# Monitor Flipside
python intel.py github FlipsideCrypto/sql_models
```

### Find Opportunities in Issues
```bash
# After analyzing repo, look for patterns
python intel.py query "What are the most common issues in Dune's GitHub repo?"

# Build better
python intel.py query "Based on Dune's GitHub issues, what should Numia prioritize?"
```

## Market Intelligence

### Track Trends
```bash
python intel.py query "What are the biggest trends in blockchain analytics right now?"
python intel.py query "Is demand for Cosmos data growing?"
python intel.py query "What do VCs care about in data infrastructure companies?"
```

### Competitive Messaging
```bash
python intel.py query "What narrative does Dune use in their marketing?"
python intel.py query "How does Messari position their research platform?"
python intel.py query "What messaging gap exists that Numia can own?"
```

## Integration with Content Generation

### Generate Competitive Content
```python
from intelligence.intel_engine import IntelligenceEngine
from src.agent import ContentAgent

# Get competitive intelligence
intel = IntelligenceEngine()
angle = intel.query("What makes Numia's Cosmos support better than competitors?")

# Generate content with that angle
agent = ContentAgent()
agent.generate_linkedin_post("Why Cosmos-native data infrastructure matters")
```

### Auto-Response Pipeline
```bash
# 1. Monitor competitor
python intel.py query "What did Dune announce this week?"

# 2. Generate response angle
python intel.py respond "Dune announced improved SQL editor"

# 3. Create content
python main.py blog "The future of blockchain data query interfaces"

# 4. Distribute
# → Publish blog, share on social, send to newsletter list
```

## Advanced Queries

### Strategic Analysis
```bash
python intel.py query "Should Numia build a free tier like Dune's?"
python intel.py query "What acquisition targets would make sense for Numia?"
python intel.py query "How to defend against The Graph entering Cosmos analytics?"
```

### Customer Research
```bash
python intel.py query "What do Cosmos validators need from analytics tools?"
python intel.py query "Why do protocols choose Dune over building in-house?"
python intel.py query "What would make Osmosis choose Numia?"
```

### Positioning
```bash
python intel.py query "Is Numia a Dune competitor or a different category?"
python intel.py query "Should Numia emphasize speed, accuracy, or ease of use?"
python intel.py query "What's the best one-liner to describe Numia vs Dune?"
```

## Daily Workflow

### Morning Routine
```bash
# Check digest
python intel.py digest

# Review any high-priority alerts
# Generate response content if needed
# Plan content calendar based on intelligence
```

### Before Customer Calls
```bash
# If they mention a competitor
python intel.py profile <competitor>

# Understand their likely pain points
python intel.py query "Common complaints about <competitor>"

# Prepare positioning
python intel.py query "Why Numia is better for <use case>"
```

### Content Planning
```bash
# Find angles
python intel.py query "What topics are competitors NOT covering?"

# Identify gaps
python intel.py gaps

# Generate ideas
python intel.py query "10 content ideas that position Numia uniquely"
```

## Tips

- **Be Specific**: "What are Dune's weaknesses in Cosmos support?" vs "Tell me about Dune"
- **Context Helps**: "For Cosmos developers, why choose Numia over Dune?"
- **Multiple Angles**: Ask same question from different perspectives
- **Save Insights**: All queries saved to `intelligence/data/` for review
- **Iterate**: Use query results to refine competitor profiles in `config.yaml`

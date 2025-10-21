# Real-Time Competitive Monitoring

Automated tracking of competitor activity across multiple channels.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run a single scan
python monitor.py scan

# Start continuous monitoring (scans every hour)
python monitor.py start

# Start monitoring with custom interval (every 30 minutes)
python monitor.py start 30

# View monitoring report
python monitor.py report

# View alerts
python monitor.py alerts
```

## What Gets Monitored

### 1. RSS Feeds (Blog Posts)
**Competitors:**
- Dune Analytics
- Nansen
- Flipside Crypto
- The Graph
- Messari

**What's Tracked:**
- New blog posts
- Product announcements
- Company updates

### 2. Twitter/X Activity
**Accounts:**
- @DuneAnalytics
- @nansen_ai
- @flipsidecrypto
- @graphprotocol
- @messaricrypto

**What's Tracked:**
- New tweets
- Product announcements
- Feature launches

### 3. GitHub Repositories
**Tracked Repos:**
- duneanalytics/spellbook
- graphprotocol/graph-node
- FlipsideCrypto/sql_models

**What's Tracked:**
- New releases
- Issue trends
- Commit activity

### 4. Pricing Pages
**Monitored URLs:**
- Dune, Nansen, Flipside, The Graph, Messari pricing pages

**What's Tracked:**
- Price changes
- New tiers
- Feature updates

## How It Works

```
┌─────────────────┐
│  Monitor Daemon │
└────────┬────────┘
         │
         ├─► RSS Monitor      ─► New blog posts
         ├─► Twitter Monitor  ─► New tweets
         ├─► GitHub Monitor   ─► New releases
         └─► Pricing Monitor  ─► Price changes
                │
                ▼
         ┌──────────────┐
         │ Alert System │
         └──────────────┘
                │
                ├─► File-based notifications
                ├─► Saved to intelligence/data/
                └─► Future: Slack, email, webhooks
```

## Monitoring Modes

### Single Scan
Run once and exit:
```bash
python monitor.py scan
```

**Use when:** Manual check, testing, scheduled cron job

### Continuous Monitoring
Runs in background, scans periodically:
```bash
# Every 60 minutes (default)
python monitor.py start

# Every 30 minutes
python monitor.py start 30

# Every 6 hours
python monitor.py start 360
```

**Use when:** Always-on monitoring, development

**Stop:** Press Ctrl+C

## Alerts

Alerts are generated when:
- **Critical:** Pricing changes
- **High:** New blog posts (3+), major releases
- **Medium:** New tweets, GitHub activity
- **Low:** Minor updates

### View Alerts
```bash
python monitor.py alerts
```

### Alert Storage
Alerts saved to: `intelligence/data/alerts/`

Each alert includes:
- Priority (critical/high/medium/low)
- Source (rss/twitter/github/pricing)
- Title and message
- Timestamp
- Full data payload

### Acknowledge Alerts
```python
from intelligence.alerts.alert_system import AlertSystem

alerts = AlertSystem()
alerts.acknowledge_alert("abc123")
```

## Data Storage

All monitoring data saved to `intelligence/data/`:

```
intelligence/data/
├── rss/                    # Blog posts
│   ├── dune_2025-01-15.json
│   └── nansen_seen.json    # Track what we've seen
├── twitter/                # Tweets
│   ├── dune_2025-01-15.json
│   └── dune_seen.json
├── github/                 # Repo analysis
│   └── duneanalytics_spellbook_2025-01-15.json
├── pricing/                # Pricing snapshots
│   ├── dune_2025-01-15.html
│   ├── dune_2025-01-15.json
│   └── dune_history.json
├── alerts/                 # Alert notifications
│   ├── high_rss_2025-01-15.json
│   └── notifications.txt
└── monitoring/             # Scan results
    └── scan_2025-01-15.json
```

## Advanced Usage

### Python API

```python
from intelligence.scrapers.rss_monitor import RSSMonitor
from intelligence.scrapers.twitter_monitor import TwitterMonitor
from intelligence.scrapers.github_monitor import GitHubMonitor
from intelligence.scrapers.pricing_monitor import PricingMonitor

# RSS monitoring
rss = RSSMonitor()
new_posts = rss.check_all()

# Twitter monitoring
twitter = TwitterMonitor()
new_tweets = twitter.check_all()

# GitHub monitoring
github = GitHubMonitor()
analysis = github.analyze_repo("duneanalytics/spellbook")

# Pricing monitoring
pricing = PricingMonitor()
changes = pricing.check_all()
```

### Custom Monitoring

```python
from intelligence.monitor_daemon import MonitoringDaemon

# Create custom interval
daemon = MonitoringDaemon(interval_minutes=15)

# Run single scan
alerts = daemon.run_scan()

# Process alerts
for source, message, data in alerts:
    print(f"{source}: {message}")
```

## Scheduled Monitoring (Cron)

Add to crontab for automated scans:

```bash
# Every hour
0 * * * * cd /path/to/b2b-marketing-ai && ./venv/bin/python monitor.py scan

# Every 6 hours
0 */6 * * * cd /path/to/b2b-marketing-ai && ./venv/bin/python monitor.py scan

# Daily at 9am
0 9 * * * cd /path/to/b2b-marketing-ai && ./venv/bin/python monitor.py scan
```

## Integration with Intelligence Engine

Monitoring data enhances intelligence queries:

```bash
# After monitoring detects new Dune blog post about "real-time data"
python intel.py respond "Dune announced real-time data streaming"

# Generate competitive response
python main.py blog "Why Numia's real-time sync is different"
```

## Monitoring Best Practices

### Scan Frequency
- **Aggressive:** Every 15-30 minutes (high API usage, best for active periods)
- **Normal:** Every 1-2 hours (recommended)
- **Conservative:** Every 6-12 hours (low resource usage)

### Rate Limiting
- RSS: No limits typically
- Twitter (Nitter): Respectful scraping, avoid hammering
- GitHub: 60 req/hour without token, 5000 with token
- Pricing pages: Every 6-24 hours recommended

### Storage Management
Clean up old data periodically:
```bash
# Remove scans older than 30 days
find intelligence/data/monitoring -name "*.json" -mtime +30 -delete
```

## Troubleshooting

### No data from RSS feeds
- Check internet connection
- Verify RSS URLs in `rss_monitor.py`
- Some feeds may be down temporarily

### Twitter monitoring not working
- Nitter instances can be flaky
- Try changing instances in `twitter_monitor.py`
- Alternative: Use official Twitter API (requires key)

### GitHub rate limit errors
- Set `GITHUB_TOKEN` environment variable
- Get token from github.com/settings/tokens

### Pricing changes not detected
- Some sites use JavaScript rendering
- May need Selenium for dynamic pages
- Check `pricing_monitor.py` extraction logic

## Future Enhancements

**Planned:**
- Slack/Discord notifications
- Email alerts
- Webhook support
- Web dashboard
- Sentiment analysis
- Trend detection
- Automatic response generation

**Integration Ideas:**
- Auto-generate competitive content when alerts fire
- Feed monitoring data into content calendar
- Track competitor content performance
- Build competitive timeline visualization

## Example Workflow

**Daily routine:**
1. Morning: `python monitor.py report` - Check what happened overnight
2. Review alerts: `python monitor.py alerts`
3. Investigate high-priority alerts
4. Generate responses as needed

**Competitive event response:**
1. Alert fires: "Dune published 'The Future of Blockchain Analytics'"
2. Read the post (link in alert data)
3. Generate response: `python intel.py respond "Dune blog about future of analytics"`
4. Create content: `python main.py blog "The real future of blockchain analytics"`
5. Acknowledge alert

## Questions?

Run the monitoring help:
```bash
python monitor.py
```

Check individual monitors:
```bash
python -c "from intelligence.scrapers.rss_monitor import RSSMonitor; RSSMonitor().check_all()"
```

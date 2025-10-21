"""
Intelligence Monitoring Daemon
Runs periodic scans of competitor activity and generates alerts
"""

import time
import json
from datetime import datetime
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from intelligence.scrapers.rss_monitor import RSSMonitor
from intelligence.scrapers.twitter_monitor import TwitterMonitor
from intelligence.scrapers.github_monitor import GitHubMonitor
from intelligence.intel_engine import IntelligenceEngine


class MonitoringDaemon:
    """Automated competitive intelligence monitoring"""

    def __init__(self, interval_minutes=60):
        self.interval = interval_minutes * 60  # Convert to seconds
        self.data_dir = Path(__file__).parent / "data" / "monitoring"
        self.data_dir.mkdir(parents=True, exist_ok=True)

        # Initialize monitors
        self.rss_monitor = RSSMonitor()
        self.twitter_monitor = TwitterMonitor()
        self.github_monitor = GitHubMonitor()
        self.intel_engine = IntelligenceEngine()

        print(f"🤖 Intelligence Monitoring Daemon")
        print(f"⏱️  Scan interval: {interval_minutes} minutes")
        print("=" * 60)

    def run_scan(self):
        """Run a complete scan of all sources"""
        print(f"\n{'='*60}")
        print(f"🔍 SCAN START: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}\n")

        alerts = []

        # 1. RSS Feeds
        print("📰 Scanning RSS Feeds...")
        try:
            new_content = self.rss_monitor.check_all()
            if new_content:
                alert = self.rss_monitor.generate_alert(new_content)
                alerts.append(("RSS", alert, new_content))
        except Exception as e:
            print(f"  ❌ RSS scan error: {e}")

        # 2. Twitter
        print("\n🐦 Scanning Twitter...")
        try:
            new_tweets = self.twitter_monitor.check_all()
            if new_tweets:
                alert = self.twitter_monitor.generate_alert(new_tweets)
                alerts.append(("Twitter", alert, new_tweets))
        except Exception as e:
            print(f"  ❌ Twitter scan error: {e}")

        # 3. GitHub
        print("\n🔧 Scanning GitHub Repos...")
        try:
            repos_to_check = [
                "duneanalytics/spellbook",
                "graphprotocol/graph-node",
                "FlipsideCrypto/sql_models"
            ]
            github_updates = {}
            for repo in repos_to_check:
                print(f"  Checking {repo}...")
                try:
                    analysis = self.github_monitor.analyze_repo(repo)
                    # Check for new releases
                    if analysis.get("recent_releases"):
                        github_updates[repo] = analysis
                except Exception as e:
                    print(f"    ⚠️  Error: {e}")

            if github_updates:
                alerts.append(("GitHub", "New repository activity detected", github_updates))
        except Exception as e:
            print(f"  ❌ GitHub scan error: {e}")

        # Save scan results
        self._save_scan_results(alerts)

        # Generate summary
        self._print_summary(alerts)

        print(f"\n{'='*60}")
        print(f"✅ SCAN COMPLETE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}\n")

        return alerts

    def _save_scan_results(self, alerts):
        """Save scan results to disk"""
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"scan_{timestamp}.json"

        scan_data = {
            "timestamp": timestamp,
            "alert_count": len(alerts),
            "alerts": [
                {
                    "source": source,
                    "message": msg,
                    "data": data
                }
                for source, msg, data in alerts
            ]
        }

        filepath = self.data_dir / filename
        with open(filepath, 'w') as f:
            json.dump(scan_data, f, indent=2)

        print(f"\n💾 Scan results saved: {filepath}")

    def _print_summary(self, alerts):
        """Print scan summary"""
        print(f"\n📊 SCAN SUMMARY")
        print("=" * 60)

        if not alerts:
            print("✅ No new competitor activity detected")
        else:
            print(f"🚨 {len(alerts)} alert(s) generated:\n")
            for source, msg, _ in alerts:
                print(f"  [{source}]")
                print(f"  {msg}\n")

    def run_once(self):
        """Run a single scan and exit"""
        self.run_scan()

    def run_continuous(self):
        """Run continuous monitoring"""
        print(f"\n🚀 Starting continuous monitoring...")
        print(f"   Scans every {self.interval // 60} minutes")
        print(f"   Press Ctrl+C to stop\n")

        scan_count = 0

        try:
            while True:
                scan_count += 1
                print(f"\n--- Scan #{scan_count} ---")

                self.run_scan()

                print(f"\n💤 Sleeping for {self.interval // 60} minutes...")
                print(f"   Next scan at: {self._next_scan_time()}")
                time.sleep(self.interval)

        except KeyboardInterrupt:
            print(f"\n\n⏸️  Monitoring stopped")
            print(f"   Total scans: {scan_count}")
            print(f"   Data saved in: {self.data_dir}\n")

    def _next_scan_time(self):
        """Calculate next scan time"""
        from datetime import datetime, timedelta
        next_time = datetime.now() + timedelta(seconds=self.interval)
        return next_time.strftime("%Y-%m-%d %H:%M:%S")

    def generate_report(self):
        """Generate a report from recent scans"""
        print("\n📈 MONITORING REPORT")
        print("=" * 60)

        # Load recent scans
        scan_files = sorted(self.data_dir.glob("scan_*.json"), reverse=True)[:10]

        if not scan_files:
            print("No scan data available")
            return

        print(f"Recent scans: {len(scan_files)}\n")

        total_alerts = 0
        sources = {}

        for scan_file in scan_files:
            with open(scan_file, 'r') as f:
                data = json.load(f)

            total_alerts += data["alert_count"]

            for alert in data["alerts"]:
                source = alert["source"]
                sources[source] = sources.get(source, 0) + 1

        print(f"Total alerts: {total_alerts}")
        print(f"\nAlerts by source:")
        for source, count in sources.items():
            print(f"  {source}: {count}")

        print("\n" + "=" * 60)


def main():
    """CLI for monitoring daemon"""
    import argparse

    parser = argparse.ArgumentParser(description="Competitive Intelligence Monitor")
    parser.add_argument("--once", action="store_true", help="Run once and exit")
    parser.add_argument("--continuous", action="store_true", help="Run continuously")
    parser.add_argument("--report", action="store_true", help="Generate report from recent scans")
    parser.add_argument("--interval", type=int, default=60, help="Scan interval in minutes (default: 60)")

    args = parser.parse_args()

    daemon = MonitoringDaemon(interval_minutes=args.interval)

    if args.report:
        daemon.generate_report()
    elif args.once:
        daemon.run_once()
    elif args.continuous:
        daemon.run_continuous()
    else:
        print("Usage:")
        print("  python monitor_daemon.py --once          # Run single scan")
        print("  python monitor_daemon.py --continuous    # Run continuous monitoring")
        print("  python monitor_daemon.py --report        # Generate report")
        print("  python monitor_daemon.py --continuous --interval 30  # Scan every 30 min")


if __name__ == "__main__":
    main()

"""
RSS Feed Monitor
Tracks competitor blog posts and announcements
"""

import feedparser
import json
from datetime import datetime
from pathlib import Path
import hashlib

class RSSMonitor:
    """Monitor RSS feeds for competitor content"""

    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / "data" / "rss"
        self.data_dir.mkdir(parents=True, exist_ok=True)

        # Competitor RSS feeds
        self.feeds = {
            "dune": [
                "https://dune.com/blog/rss.xml",
                "https://dune.com/feed"
            ],
            "nansen": [
                "https://www.nansen.ai/research/rss",
                "https://www.nansen.ai/post/rss.xml"
            ],
            "flipside": [
                "https://flipsidecrypto.xyz/feed",
                "https://science.flipsidecrypto.xyz/feed/"
            ],
            "the_graph": [
                "https://thegraph.com/blog/rss.xml",
                "https://thegraph.com/feed"
            ],
            "messari": [
                "https://messari.io/rss",
                "https://messari.io/feed"
            ]
        }

    def fetch_feed(self, url):
        """Fetch and parse RSS feed"""
        try:
            feed = feedparser.parse(url)
            if feed.bozo:
                # Feed parsing error
                return None
            return feed
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None

    def check_competitor(self, competitor_name):
        """Check all feeds for a competitor"""
        print(f"📡 Checking {competitor_name}...")

        all_entries = []
        feeds = self.feeds.get(competitor_name, [])

        for feed_url in feeds:
            feed = self.fetch_feed(feed_url)
            if feed and hasattr(feed, 'entries'):
                all_entries.extend(feed.entries)

        if not all_entries:
            print(f"  ⚠️  No entries found")
            return []

        # Process entries
        processed = []
        for entry in all_entries:
            item = {
                "title": entry.get("title", "Untitled"),
                "link": entry.get("link", ""),
                "published": entry.get("published", entry.get("updated", "")),
                "summary": entry.get("summary", entry.get("description", ""))[:300],
                "id": self._generate_id(entry)
            }
            processed.append(item)

        # Check for new items
        new_items = self._filter_new_items(competitor_name, processed)

        if new_items:
            print(f"  ✅ Found {len(new_items)} new items")
            self._save_items(competitor_name, new_items)
        else:
            print(f"  ℹ️  No new items")

        return new_items

    def _generate_id(self, entry):
        """Generate unique ID for entry"""
        unique_str = entry.get("link", "") + entry.get("title", "")
        return hashlib.md5(unique_str.encode()).hexdigest()

    def _filter_new_items(self, competitor_name, items):
        """Filter out items we've already seen"""
        seen_file = self.data_dir / f"{competitor_name}_seen.json"

        # Load seen IDs
        seen_ids = set()
        if seen_file.exists():
            with open(seen_file, 'r') as f:
                seen_ids = set(json.load(f))

        # Find new items
        new_items = []
        new_ids = set()

        for item in items:
            item_id = item["id"]
            if item_id not in seen_ids:
                new_items.append(item)
                new_ids.add(item_id)

        # Update seen IDs
        if new_ids:
            seen_ids.update(new_ids)
            with open(seen_file, 'w') as f:
                json.dump(list(seen_ids), f, indent=2)

        return new_items

    def _save_items(self, competitor_name, items):
        """Save new items to disk"""
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"{competitor_name}_{timestamp}.json"

        filepath = self.data_dir / filename
        with open(filepath, 'w') as f:
            json.dump({
                "competitor": competitor_name,
                "timestamp": timestamp,
                "items": items
            }, f, indent=2)

        print(f"  💾 Saved: {filepath}")

    def check_all(self):
        """Check all competitors"""
        print("\n🔍 RSS Feed Monitor - Checking All Competitors\n")
        print("=" * 60)

        all_new = {}
        for competitor in self.feeds.keys():
            new_items = self.check_competitor(competitor)
            if new_items:
                all_new[competitor] = new_items

        print("=" * 60)
        print(f"\n📊 Summary: {sum(len(items) for items in all_new.values())} new items across {len(all_new)} competitors\n")

        return all_new

    def generate_alert(self, new_items):
        """Generate alert message for new content"""
        if not new_items:
            return "No new competitor content detected."

        alert = "🚨 NEW COMPETITOR CONTENT DETECTED\n\n"

        for competitor, items in new_items.items():
            alert += f"**{competitor.upper()}** ({len(items)} new):\n"
            for item in items[:3]:  # Show first 3
                alert += f"  • {item['title']}\n"
                alert += f"    {item['link']}\n"
            if len(items) > 3:
                alert += f"  ... and {len(items) - 3} more\n"
            alert += "\n"

        return alert


def main():
    """Test RSS monitoring"""
    monitor = RSSMonitor()

    print("RSS Feed Monitor")
    print("=" * 60)
    print("\nConfigured feeds:")
    for comp, feeds in monitor.feeds.items():
        print(f"  {comp}: {len(feeds)} feeds")

    print("\n" + "=" * 60)
    print("Run monitor.check_all() to scan all feeds")
    print("Example: monitor.check_competitor('dune')")


if __name__ == "__main__":
    main()

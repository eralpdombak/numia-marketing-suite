"""
Twitter/X Monitor
Track competitor social media activity
Note: Requires Twitter API access or uses web scraping fallback
"""

import json
import requests
from datetime import datetime
from pathlib import Path
import hashlib

class TwitterMonitor:
    """Monitor competitor Twitter accounts"""

    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / "data" / "twitter"
        self.data_dir.mkdir(parents=True, exist_ok=True)

        # Competitor Twitter handles
        self.accounts = {
            "dune": "DuneAnalytics",
            "nansen": "nansen_ai",
            "flipside": "flipsidecrypto",
            "the_graph": "graphprotocol",
            "messari": "messaricrypto"
        }

    def fetch_tweets_nitter(self, username, limit=10):
        """
        Fetch tweets using Nitter (Twitter frontend alternative)
        More reliable than scraping Twitter directly
        """
        # Nitter instances (public mirrors)
        nitter_instances = [
            "https://nitter.net",
            "https://nitter.privacydev.net",
            "https://nitter.1d4.us"
        ]

        for instance in nitter_instances:
            try:
                url = f"{instance}/{username}/rss"
                response = requests.get(url, timeout=10)

                if response.status_code == 200:
                    # Parse RSS feed
                    import feedparser
                    feed = feedparser.parse(response.content)

                    tweets = []
                    for entry in feed.entries[:limit]:
                        tweet = {
                            "id": self._generate_id(entry.link),
                            "text": entry.get("title", ""),
                            "link": entry.get("link", ""),
                            "published": entry.get("published", ""),
                            "summary": entry.get("summary", "")
                        }
                        tweets.append(tweet)

                    return tweets
            except Exception as e:
                print(f"  ⚠️  {instance} failed: {e}")
                continue

        print(f"  ❌ All Nitter instances failed for @{username}")
        return []

    def check_account(self, competitor_name):
        """Check Twitter activity for a competitor"""
        username = self.accounts.get(competitor_name)
        if not username:
            print(f"  ⚠️  No Twitter account configured for {competitor_name}")
            return []

        print(f"🐦 Checking @{username}...")

        tweets = self.fetch_tweets_nitter(username, limit=20)

        if not tweets:
            print(f"  ⚠️  No tweets fetched")
            return []

        # Filter new tweets
        new_tweets = self._filter_new_tweets(competitor_name, tweets)

        if new_tweets:
            print(f"  ✅ Found {len(new_tweets)} new tweets")
            self._save_tweets(competitor_name, new_tweets)
        else:
            print(f"  ℹ️  No new tweets")

        return new_tweets

    def _generate_id(self, link):
        """Generate unique ID from tweet link"""
        return hashlib.md5(link.encode()).hexdigest()

    def _filter_new_tweets(self, competitor_name, tweets):
        """Filter out tweets we've already seen"""
        seen_file = self.data_dir / f"{competitor_name}_seen.json"

        # Load seen IDs
        seen_ids = set()
        if seen_file.exists():
            with open(seen_file, 'r') as f:
                seen_ids = set(json.load(f))

        # Find new tweets
        new_tweets = []
        new_ids = set()

        for tweet in tweets:
            tweet_id = tweet["id"]
            if tweet_id not in seen_ids:
                new_tweets.append(tweet)
                new_ids.add(tweet_id)

        # Update seen IDs
        if new_ids:
            seen_ids.update(new_ids)
            with open(seen_file, 'w') as f:
                json.dump(list(seen_ids), f, indent=2)

        return new_tweets

    def _save_tweets(self, competitor_name, tweets):
        """Save new tweets to disk"""
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"{competitor_name}_{timestamp}.json"

        filepath = self.data_dir / filename
        with open(filepath, 'w') as f:
            json.dump({
                "competitor": competitor_name,
                "account": self.accounts[competitor_name],
                "timestamp": timestamp,
                "tweets": tweets
            }, f, indent=2)

        print(f"  💾 Saved: {filepath}")

    def check_all(self):
        """Check all competitor accounts"""
        print("\n🔍 Twitter Monitor - Checking All Accounts\n")
        print("=" * 60)

        all_new = {}
        for competitor in self.accounts.keys():
            new_tweets = self.check_account(competitor)
            if new_tweets:
                all_new[competitor] = new_tweets

        print("=" * 60)
        print(f"\n📊 Summary: {sum(len(tweets) for tweets in all_new.values())} new tweets across {len(all_new)} accounts\n")

        return all_new

    def search_mentions(self, keyword="numia"):
        """
        Search for mentions of a keyword (e.g., "Numia")
        Note: Limited without API access
        """
        print(f"🔍 Searching for mentions of '{keyword}'...")
        print("  ⚠️  Note: Search requires Twitter API or web scraping")
        print("  💡 Tip: Use Twitter Advanced Search manually for now")

        # Placeholder for future API integration
        return []

    def generate_alert(self, new_tweets):
        """Generate alert for new tweets"""
        if not new_tweets:
            return "No new competitor tweets detected."

        alert = "🐦 NEW COMPETITOR TWEETS\n\n"

        for competitor, tweets in new_tweets.items():
            username = self.accounts[competitor]
            alert += f"**@{username}** ({len(tweets)} new):\n"

            for tweet in tweets[:3]:  # Show first 3
                alert += f"  • {tweet['text'][:100]}...\n"
                alert += f"    {tweet['link']}\n"

            if len(tweets) > 3:
                alert += f"  ... and {len(tweets) - 3} more\n"
            alert += "\n"

        return alert


def main():
    """Test Twitter monitoring"""
    monitor = TwitterMonitor()

    print("Twitter Monitor")
    print("=" * 60)
    print("\nTracked accounts:")
    for comp, handle in monitor.accounts.items():
        print(f"  {comp}: @{handle}")

    print("\n" + "=" * 60)
    print("Note: Uses Nitter (Twitter frontend) for data fetching")
    print("Run monitor.check_all() to scan all accounts")


if __name__ == "__main__":
    main()

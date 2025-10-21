"""
Pricing Page Monitor
Detects changes in competitor pricing
"""

import requests
import json
import hashlib
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup


class PricingMonitor:
    """Monitor competitor pricing pages for changes"""

    def __init__(self):
        self.data_dir = Path(__file__).parent.parent / "data" / "pricing"
        self.data_dir.mkdir(parents=True, exist_ok=True)

        # Competitor pricing pages
        self.pricing_pages = {
            "dune": "https://dune.com/pricing",
            "nansen": "https://www.nansen.ai/pricing",
            "flipside": "https://flipsidecrypto.xyz/pricing",
            "the_graph": "https://thegraph.com/pricing",
            "messari": "https://messari.io/pricing"
        }

    def fetch_page(self, url):
        """Fetch pricing page content"""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            }
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code == 200:
                return response.text
            else:
                print(f"  ⚠️  HTTP {response.status_code}")
                return None
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return None

    def extract_pricing_info(self, html):
        """Extract pricing information from HTML"""
        try:
            soup = BeautifulSoup(html, 'html.parser')

            # Look for common pricing indicators
            pricing_data = {
                "price_mentions": [],
                "tier_names": [],
                "features": []
            }

            # Find price mentions ($ amounts)
            import re
            price_pattern = r'\$\s*\d+(?:,\d{3})*(?:\.\d{2})?(?:\s*(?:/|per)\s*\w+)?'
            prices = re.findall(price_pattern, soup.get_text())
            pricing_data["price_mentions"] = list(set(prices))

            # Find tier/plan names
            tier_keywords = ['free', 'starter', 'pro', 'premium', 'enterprise', 'basic', 'plus']
            text_lower = soup.get_text().lower()
            for keyword in tier_keywords:
                if keyword in text_lower:
                    pricing_data["tier_names"].append(keyword)

            # Get meta description
            meta = soup.find('meta', attrs={'name': 'description'})
            if meta:
                pricing_data["meta_description"] = meta.get('content', '')

            return pricing_data
        except Exception as e:
            print(f"  ⚠️  Extraction error: {e}")
            return {}

    def check_competitor(self, competitor_name):
        """Check pricing page for a competitor"""
        url = self.pricing_pages.get(competitor_name)
        if not url:
            print(f"  ⚠️  No pricing URL for {competitor_name}")
            return None

        print(f"💲 Checking {competitor_name} pricing...")

        html = self.fetch_page(url)
        if not html:
            return None

        # Extract pricing info
        pricing_info = self.extract_pricing_info(html)

        # Generate content hash
        content_hash = hashlib.md5(html.encode()).hexdigest()

        # Check if changed
        changed = self._check_for_changes(competitor_name, content_hash, pricing_info)

        if changed:
            print(f"  🚨 PRICING CHANGE DETECTED!")
            self._save_snapshot(competitor_name, html, pricing_info, content_hash)
        else:
            print(f"  ✅ No changes detected")

        return {
            "changed": changed,
            "pricing_info": pricing_info
        }

    def _check_for_changes(self, competitor_name, current_hash, pricing_info):
        """Check if pricing has changed since last check"""
        history_file = self.data_dir / f"{competitor_name}_history.json"

        if not history_file.exists():
            # First time checking
            return True

        with open(history_file, 'r') as f:
            history = json.load(f)

        last_hash = history.get("last_hash")

        # Update history
        history["last_hash"] = current_hash
        history["last_check"] = datetime.now().isoformat()
        history["check_count"] = history.get("check_count", 0) + 1

        with open(history_file, 'w') as f:
            json.dump(history, f, indent=2)

        return current_hash != last_hash

    def _save_snapshot(self, competitor_name, html, pricing_info, content_hash):
        """Save pricing page snapshot"""
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

        # Save HTML
        html_file = self.data_dir / f"{competitor_name}_{timestamp}.html"
        with open(html_file, 'w') as f:
            f.write(html)

        # Save extracted info
        info_file = self.data_dir / f"{competitor_name}_{timestamp}.json"
        with open(info_file, 'w') as f:
            json.dump({
                "competitor": competitor_name,
                "timestamp": timestamp,
                "content_hash": content_hash,
                "pricing_info": pricing_info
            }, f, indent=2)

        print(f"  💾 Snapshot saved: {info_file}")

    def check_all(self):
        """Check all competitor pricing pages"""
        print("\n🔍 Pricing Monitor - Checking All Competitors\n")
        print("=" * 60)

        changes = {}
        for competitor in self.pricing_pages.keys():
            result = self.check_competitor(competitor)
            if result and result["changed"]:
                changes[competitor] = result["pricing_info"]

        print("=" * 60)
        if changes:
            print(f"\n🚨 {len(changes)} pricing change(s) detected!\n")
        else:
            print(f"\n✅ No pricing changes detected\n")

        return changes

    def generate_alert(self, changes):
        """Generate alert for pricing changes"""
        if not changes:
            return "No pricing changes detected."

        alert = "💲 PRICING CHANGES DETECTED\n\n"

        for competitor, info in changes.items():
            alert += f"**{competitor.upper()}**:\n"
            alert += f"  URL: {self.pricing_pages[competitor]}\n"

            if info.get("price_mentions"):
                alert += f"  Prices found: {', '.join(info['price_mentions'][:5])}\n"

            if info.get("tier_names"):
                alert += f"  Tiers: {', '.join(info['tier_names'])}\n"

            alert += "\n"

        return alert


def main():
    """Test pricing monitoring"""
    monitor = PricingMonitor()

    print("Pricing Monitor")
    print("=" * 60)
    print("\nTracked pricing pages:")
    for comp, url in monitor.pricing_pages.items():
        print(f"  {comp}: {url}")

    print("\n" + "=" * 60)
    print("Note: Requires BeautifulSoup for HTML parsing")
    print("Run monitor.check_all() to scan all pricing pages")


if __name__ == "__main__":
    main()

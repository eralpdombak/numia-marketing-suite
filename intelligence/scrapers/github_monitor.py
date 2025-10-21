"""
GitHub Repository Monitor
Tracks competitor repos for releases, issues, activity
"""

import os
import json
import requests
from datetime import datetime
from pathlib import Path

class GitHubMonitor:
    """Monitor competitor GitHub repositories"""

    def __init__(self):
        # GitHub token is optional but recommended for higher rate limits
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.headers = {}
        if self.github_token:
            self.headers["Authorization"] = f"token {self.github_token}"

        self.data_dir = Path(__file__).parent.parent / "data" / "github"
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def fetch_repo_info(self, repo_full_name):
        """
        Fetch basic repo information

        Args:
            repo_full_name: e.g., "duneanalytics/spellbook"

        Returns:
            dict with repo data
        """
        url = f"https://api.github.com/repos/{repo_full_name}"
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"Failed to fetch: {response.status_code}"}

    def fetch_recent_releases(self, repo_full_name, limit=5):
        """Fetch recent releases"""
        url = f"https://api.github.com/repos/{repo_full_name}/releases"
        response = requests.get(url, headers=self.headers, params={"per_page": limit})

        if response.status_code == 200:
            return response.json()
        else:
            return []

    def fetch_recent_issues(self, repo_full_name, state="open", limit=10):
        """Fetch recent issues"""
        url = f"https://api.github.com/repos/{repo_full_name}/issues"
        params = {
            "state": state,
            "per_page": limit,
            "sort": "created",
            "direction": "desc"
        }
        response = requests.get(url, headers=self.headers, params=params)

        if response.status_code == 200:
            return response.json()
        else:
            return []

    def fetch_commit_activity(self, repo_full_name):
        """Fetch commit activity stats"""
        url = f"https://api.github.com/repos/{repo_full_name}/stats/commit_activity"
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            return response.json()
        else:
            return []

    def analyze_repo(self, repo_full_name):
        """
        Complete analysis of a repository

        Returns detailed intelligence report
        """
        print(f"📊 Analyzing {repo_full_name}...")

        # Fetch data
        repo_info = self.fetch_repo_info(repo_full_name)
        releases = self.fetch_recent_releases(repo_full_name)
        issues = self.fetch_recent_issues(repo_full_name)
        commit_activity = self.fetch_commit_activity(repo_full_name)

        if "error" in repo_info:
            return repo_info

        # Build analysis
        analysis = {
            "repo": repo_full_name,
            "analyzed_at": datetime.now().isoformat(),
            "overview": {
                "stars": repo_info.get("stargazers_count", 0),
                "forks": repo_info.get("forks_count", 0),
                "watchers": repo_info.get("watchers_count", 0),
                "open_issues": repo_info.get("open_issues_count", 0),
                "description": repo_info.get("description", ""),
                "language": repo_info.get("language", ""),
                "last_updated": repo_info.get("updated_at", ""),
            },
            "recent_releases": [
                {
                    "name": r.get("name", r.get("tag_name")),
                    "published_at": r.get("published_at"),
                    "body": r.get("body", "")[:200]  # First 200 chars
                }
                for r in releases[:3]
            ],
            "recent_issues": [
                {
                    "title": i.get("title"),
                    "created_at": i.get("created_at"),
                    "state": i.get("state"),
                    "comments": i.get("comments", 0),
                    "labels": [l.get("name") for l in i.get("labels", [])]
                }
                for i in issues[:5]
            ],
            "activity_signal": self._assess_activity(repo_info, commit_activity)
        }

        # Save analysis
        self._save_analysis(repo_full_name, analysis)

        return analysis

    def _assess_activity(self, repo_info, commit_activity):
        """Assess repository activity level"""
        # Simple heuristic
        last_update = repo_info.get("updated_at", "")
        open_issues = repo_info.get("open_issues_count", 0)

        if not last_update:
            return "unknown"

        # Parse date
        from datetime import datetime
        try:
            last_update_date = datetime.fromisoformat(last_update.replace("Z", "+00:00"))
            days_since_update = (datetime.now(last_update_date.tzinfo) - last_update_date).days

            if days_since_update < 7:
                activity = "high"
            elif days_since_update < 30:
                activity = "medium"
            else:
                activity = "low"

            return {
                "level": activity,
                "days_since_update": days_since_update,
                "open_issues": open_issues
            }
        except:
            return "unknown"

    def _save_analysis(self, repo_name, analysis):
        """Save analysis to disk"""
        safe_name = repo_name.replace("/", "_")
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"{safe_name}_{timestamp}.json"

        filepath = self.data_dir / filename
        with open(filepath, 'w') as f:
            json.dump(analysis, f, indent=2)

        print(f"💾 Saved: {filepath}")

    def compare_repos(self, repo_list):
        """Compare multiple repositories"""
        print(f"🔍 Comparing {len(repo_list)} repositories...\n")

        results = {}
        for repo in repo_list:
            results[repo] = self.analyze_repo(repo)

        # Generate comparison
        comparison = {
            "compared_at": datetime.now().isoformat(),
            "repos": results,
            "summary": self._generate_comparison_summary(results)
        }

        return comparison

    def _generate_comparison_summary(self, results):
        """Generate a comparison summary"""
        summary = {
            "most_active": None,
            "most_stars": None,
            "most_issues": None,
            "recent_releases": []
        }

        # Find most active, starred, etc.
        max_stars = 0
        max_issues = 0

        for repo_name, data in results.items():
            if "error" in data:
                continue

            overview = data.get("overview", {})
            stars = overview.get("stars", 0)
            issues = overview.get("open_issues", 0)

            if stars > max_stars:
                max_stars = stars
                summary["most_stars"] = repo_name

            if issues > max_issues:
                max_issues = issues
                summary["most_issues"] = repo_name

            # Collect recent releases
            for release in data.get("recent_releases", []):
                summary["recent_releases"].append({
                    "repo": repo_name,
                    "release": release
                })

        return summary


def main():
    """Example usage"""
    monitor = GitHubMonitor()

    # Example: Analyze Dune's main repo
    print("\n" + "="*60)
    print("GitHub Repository Monitor")
    print("="*60 + "\n")

    print("Example usage:")
    print("  monitor = GitHubMonitor()")
    print("  monitor.analyze_repo('duneanalytics/spellbook')")
    print("  monitor.compare_repos(['duneanalytics/spellbook', 'graphprotocol/graph-node'])")
    print("\nNote: Set GITHUB_TOKEN env var for higher rate limits")


if __name__ == "__main__":
    main()

import json
from datetime import datetime
from pathlib import Path

class ContentTracker:
    """Simple tracker for generated content - learns from what you create"""

    def __init__(self):
        self.tracker_file = Path("content_log.json")
        self.log = self._load_log()

    def _load_log(self):
        """Load existing content log"""
        if self.tracker_file.exists():
            with open(self.tracker_file, 'r') as f:
                return json.load(f)
        return {"generated_count": 0, "content": []}

    def _save_log(self):
        """Save content log"""
        with open(self.tracker_file, 'w') as f:
            json.dump(self.log, f, indent=2)

    def track(self, topic, content_type, file_path, word_count, perspective=None):
        """Track a piece of generated content"""
        entry = {
            "id": self.log["generated_count"] + 1,
            "timestamp": datetime.now().isoformat(),
            "topic": topic,
            "content_type": content_type,
            "file_path": file_path,
            "word_count": word_count,
            "perspective": perspective
        }

        self.log["content"].append(entry)
        self.log["generated_count"] += 1
        self._save_log()

        return entry["id"]

    def has_generated(self, topic, content_type=None):
        """Check if topic has been generated before"""
        for entry in self.log["content"]:
            if entry["topic"].lower() == topic.lower():
                if content_type is None or entry["content_type"] == content_type:
                    return True
        return False

    def get_recent(self, limit=10):
        """Get recent generated content"""
        return self.log["content"][-limit:]

    def get_stats(self):
        """Get generation statistics"""
        stats = {
            "total_generated": self.log["generated_count"],
            "by_type": {},
            "total_words": 0
        }

        for entry in self.log["content"]:
            content_type = entry["content_type"]
            stats["by_type"][content_type] = stats["by_type"].get(content_type, 0) + 1
            stats["total_words"] += entry.get("word_count", 0)

        return stats

    def search(self, keyword):
        """Search for content by keyword in topic"""
        results = []
        keyword_lower = keyword.lower()

        for entry in self.log["content"]:
            if keyword_lower in entry["topic"].lower():
                results.append(entry)

        return results

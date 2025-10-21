#!/usr/bin/env python3
"""View content generation statistics and history"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "src"))
from content_tracker import ContentTracker

def main():
    tracker = ContentTracker()

    print("\n📊 Content Generation Statistics\n")
    print("=" * 60)

    stats = tracker.get_stats()

    print(f"\n📝 Total Generated: {stats['total_generated']} pieces")
    print(f"📖 Total Words: {stats['total_words']:,}")

    if stats['by_type']:
        print(f"\n📂 By Content Type:")
        for content_type, count in stats['by_type'].items():
            print(f"   {content_type}: {count}")

    print(f"\n📅 Recent Content (Last 10):\n")

    recent = tracker.get_recent(10)
    if recent:
        for entry in recent:
            timestamp = entry['timestamp'][:10]  # Just the date
            perspective = f" [{entry['perspective']}]" if entry.get('perspective') else ""
            print(f"   {timestamp} - {entry['content_type']}{perspective}")
            print(f"   → {entry['topic']}")
            print(f"   → {entry['word_count']} words")
            print()
    else:
        print("   No content generated yet")

    print("=" * 60)

    # Show command for searching
    print("\nTo search: python3 content_stats.py search <keyword>")
    print("Example: python3 content_stats.py search blockchain\n")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "search":
        if len(sys.argv) < 3:
            print("Usage: python3 content_stats.py search <keyword>")
            sys.exit(1)

        tracker = ContentTracker()
        keyword = sys.argv[2]
        results = tracker.search(keyword)

        print(f"\n🔍 Search results for '{keyword}':\n")
        print("=" * 60)

        if results:
            for entry in results:
                timestamp = entry['timestamp'][:10]
                perspective = f" [{entry['perspective']}]" if entry.get('perspective') else ""
                print(f"\n{timestamp} - {entry['content_type']}{perspective}")
                print(f"Topic: {entry['topic']}")
                print(f"Words: {entry['word_count']}")
                print(f"File: {entry['file_path']}")
        else:
            print(f"No content found matching '{keyword}'")

        print("\n" + "=" * 60 + "\n")
    else:
        main()

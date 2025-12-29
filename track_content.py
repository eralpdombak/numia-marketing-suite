"""
Smart Content Tracker
Summarizes generated content when it makes sense. No dumb word counts.
"""

import os
import json
import hashlib
from datetime import datetime
from pathlib import Path
import anthropic
from dotenv import load_dotenv

load_dotenv()

CONTENT_INDEX = "content_index.json"
OUTPUT_DIRS = {
    "blog": "output/blog-posts",
    "linkedin": "output/linkedin-posts",
    "newsletter": "output/newsletters",
    "twitter": "output/twitter-threads"
}


def get_file_hash(filepath):
    """Get hash of file content to detect duplicates"""
    with open(filepath, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()


def load_index():
    """Load existing content index"""
    if os.path.exists(CONTENT_INDEX):
        with open(CONTENT_INDEX, 'r') as f:
            return json.load(f)
    return {"tracked_files": {}}


def save_index(index):
    """Save content index"""
    with open(CONTENT_INDEX, 'w') as f:
        json.dump(index, indent=2, fp=f)


def summarize_content(filepath, content_type):
    """Generate smart summary of content using Claude"""
    client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

    with open(filepath, 'r') as f:
        content = f.read()

    prompt = f"""Analyze this {content_type} content and provide a concise summary.

Content:
{content}

Provide JSON with:
{{
    "main_topic": "one sentence topic/headline",
    "key_points": ["point 1", "point 2", "point 3"],
    "tone": "description of tone (e.g., technical, conversational, data-driven)",
    "hook": "the main hook or value proposition",
    "use_case": "when/why would someone reference this?"
}}

Be specific. Focus on what makes this piece unique or useful."""

    response = client.messages.create(
        model="claude-3-7-sonnet-20250219",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )

    result_text = ""
    for block in response.content:
        if hasattr(block, 'text'):
            result_text += block.text

    # Extract JSON from markdown code blocks if present
    import re
    json_match = re.search(r'```json\s*(\{.*?\})\s*```', result_text, re.DOTALL)
    if json_match:
        result_text = json_match.group(1)

    try:
        return json.loads(result_text)
    except json.JSONDecodeError:
        # Fallback minimal summary
        return {
            "main_topic": os.path.basename(filepath),
            "key_points": ["Content saved but summary failed to parse"],
            "tone": "unknown",
            "hook": "N/A",
            "use_case": "Reference generated content"
        }


def scan_and_track():
    """Scan output directories and track new content"""
    index = load_index()
    new_content = []

    for content_type, directory in OUTPUT_DIRS.items():
        if not os.path.exists(directory):
            continue

        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)

            # Skip directories and hidden files
            if not os.path.isfile(filepath) or filename.startswith('.'):
                continue

            file_hash = get_file_hash(filepath)

            # Check if already tracked
            if filepath in index["tracked_files"]:
                # Check if content changed
                if index["tracked_files"][filepath]["hash"] == file_hash:
                    continue  # Already tracked, unchanged
                else:
                    print(f"⚠️  Content changed: {filename}")

            # New or changed content - summarize it
            print(f"📝 Summarizing new {content_type}: {filename}")
            summary = summarize_content(filepath, content_type)

            index["tracked_files"][filepath] = {
                "hash": file_hash,
                "content_type": content_type,
                "filename": filename,
                "tracked_at": datetime.now().isoformat(),
                "summary": summary
            }

            new_content.append({
                "type": content_type,
                "file": filename,
                "summary": summary
            })

    if new_content:
        save_index(index)
        print(f"\n✓ Tracked {len(new_content)} new piece(s) of content")
        return new_content
    else:
        print("\n✓ No new content to track")
        return []


def show_summary():
    """Show summary of tracked content"""
    index = load_index()

    if not index["tracked_files"]:
        print("No content tracked yet")
        return

    print("\n" + "="*60)
    print("CONTENT LIBRARY")
    print("="*60 + "\n")

    by_type = {}
    for filepath, data in index["tracked_files"].items():
        content_type = data["content_type"]
        if content_type not in by_type:
            by_type[content_type] = []
        by_type[content_type].append(data)

    for content_type, items in sorted(by_type.items()):
        print(f"\n{content_type.upper()} ({len(items)} pieces)")
        print("-" * 40)
        for item in items:
            summary = item["summary"]
            print(f"\n  {item['filename']}")
            print(f"  Topic: {summary.get('main_topic', 'N/A')}")
            print(f"  Hook: {summary.get('hook', 'N/A')}")
            print(f"  Use case: {summary.get('use_case', 'N/A')}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--summary":
        show_summary()
    else:
        new_items = scan_and_track()
        if new_items:
            print("\nNew content summaries:")
            for item in new_items:
                print(f"\n  {item['type']}: {item['file']}")
                print(f"    {item['summary']['main_topic']}")

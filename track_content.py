"""
Smart Content Tracker
Summarizes generated content when it makes sense. No dumb word counts.
"""

import os
import json
import hashlib
from datetime import datetime
from pathlib import Path

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


def extract_post_copy(content):
    """Extract just the POST COPY section from markdown files"""
    import re

    # Try to find POST COPY section
    match = re.search(r'## POST COPY\s*\n\n(.*?)(?=\n---|\n##|$)', content, re.DOTALL)
    if match:
        return match.group(1).strip()

    # If no POST COPY section, assume entire file is the post
    # Remove the title heading (first # line) and return the rest
    lines = content.split('\n')
    if lines and lines[0].startswith('# '):
        # Skip the title line and any empty lines after it
        content_lines = []
        for i, line in enumerate(lines[1:], 1):
            if line.strip():  # Found first non-empty line
                content_lines = lines[i:]
                break
        return '\n'.join(content_lines).strip()

    # Fallback: return content as-is
    return content.strip()

def extract_title(content):
    """Extract a clean title from markdown file"""
    import re

    # Try to find the first heading
    match = re.search(r'^#\s+(.+?)$', content, re.MULTILINE)
    if match:
        # Clean up the title - remove "LinkedIn Post:" prefix if present
        title = match.group(1)
        title = re.sub(r'^LinkedIn Post:\s*', '', title)
        return title.strip()

    # Fallback to filename-based title
    return "LinkedIn Post"

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

            # Extract content
            with open(filepath, 'r') as f:
                full_content = f.read()

            if content_type in ['linkedin', 'twitter']:
                print(f"📝 Extracting {content_type} post: {filename}")
                display_content = extract_post_copy(full_content)
                title = extract_title(full_content)
            else:
                print(f"📝 Tracking {content_type}: {filename}")
                display_content = full_content
                title = filename

            index["tracked_files"][filepath] = {
                "hash": file_hash,
                "content_type": content_type,
                "filename": filename,
                "tracked_at": datetime.now().isoformat(),
                "title": title,
                "display_content": display_content
            }

            new_content.append({
                "type": content_type,
                "file": filename,
                "title": title
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
            print(f"\n  {item['filename']}")
            print(f"  Title: {item.get('title', 'N/A')}")
            print(f"  Created: {item.get('tracked_at', 'N/A')}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--summary":
        show_summary()
    else:
        new_items = scan_and_track()
        if new_items:
            print("\nNew content added:")
            for item in new_items:
                print(f"\n  {item['type']}: {item['file']}")
                print(f"    {item['title']}")

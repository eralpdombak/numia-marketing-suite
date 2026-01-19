#!/usr/bin/env python3
"""
Sync posts from Claude-generated markdown to Typefully.
Usage: python scripts/sync_typefully.py output/linkedin/2025-01-12.md
"""

import os
import re
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
TYPEFULLY_API_KEY = os.getenv('TYPEFULLY_API_KEY')


def parse_markdown(file_path):
    """Extract posts from markdown file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by post separators (---\nPOST or ---\nTHREAD)
    posts = []
    post_pattern = r'---\n(POST|THREAD)\s+(\d+/\d+):\s+([^\n]+)\n---\n(.*?)(?=\n---\n(?:POST|THREAD)|\n\[IMG:|$)'

    for match in re.finditer(post_pattern, content, re.DOTALL):
        post_type, numbering, title, text = match.groups()

        # Extract image codename if present
        img_match = re.search(r'\[IMG:([A-Z0-9-]+)\]', content[match.end():])
        img_codename = img_match.group(1) if img_match else None

        # Clean up the post text
        text = text.strip()

        posts.append({
            'type': post_type.lower(),
            'numbering': numbering,
            'title': title.strip(),
            'content': text,
            'img_codename': img_codename
        })

    return posts


def match_image(codename):
    """Find image file by codename and return path."""
    if not codename:
        return None

    img_path = Path(f"output/images/{codename}.png")
    if img_path.exists():
        return str(img_path)

    return None


def upload_image_to_typefully(image_path):
    """Upload image to Typefully and return media ID."""
    if not image_path or not TYPEFULLY_API_KEY:
        return None

    # Typefully expects images to be uploaded first to get media IDs
    # For now, we'll just return the path - you may need to implement
    # actual upload to Typefully's media endpoint
    # Check Typefully API docs for the exact endpoint

    # Placeholder - replace with actual Typefully media upload
    print(f"  📸 Image found: {image_path}")
    return image_path


def get_social_set_id():
    """Get the first social set ID from Typefully."""
    if not TYPEFULLY_API_KEY:
        return None

    url = 'https://api.typefully.com/v2/social-sets'
    headers = {
        'Authorization': f'Bearer {TYPEFULLY_API_KEY}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

        # Handle Typefully v2 API response structure
        if isinstance(data, dict) and 'results' in data:
            social_sets = data['results']
        elif isinstance(data, list):
            social_sets = data
        else:
            social_sets = [data] if data else []

        if social_sets and len(social_sets) > 0:
            return social_sets[0]['id']

        print("   No social sets found in account")
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to get social set ID: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"   Response: {e.response.text}")
        return None


def push_to_typefully(post, image_path=None, social_set_id=None):
    """POST to Typefully API v2."""
    if not TYPEFULLY_API_KEY:
        print("❌ TYPEFULLY_API_KEY not found in .env file")
        return False

    if not social_set_id:
        print("❌ No social set ID available")
        return False

    # Determine platform from post type
    platform = 'linkedin' if 'linkedin' in str(sys.argv[1]).lower() else 'x'

    # Prepare the request (v2 API format)
    url = f'https://api.typefully.com/v2/social-sets/{social_set_id}/drafts'
    headers = {
        'Authorization': f'Bearer {TYPEFULLY_API_KEY}',
        'Content-Type': 'application/json'
    }

    payload = {
        'platforms': {
            platform: {
                'enabled': True,
                'posts': [
                    {
                        'text': post['content']
                    }
                ]
            }
        }
    }

    # Add media if available (would need media_ids from Typefully upload)
    # For now, images are not implemented - focus on text-only posts

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print(f"  ✓ Pushed: {post['title']}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"  ✗ Failed: {post['title']} - {e}")
        if hasattr(e.response, 'text'):
            print(f"     Response: {e.response.text}")
        return False


def main(markdown_file):
    """Main execution."""
    if not Path(markdown_file).exists():
        print(f"❌ File not found: {markdown_file}")
        sys.exit(1)

    print(f"\n📄 Reading: {markdown_file}\n")

    # Get social set ID first
    print("🔑 Getting Typefully social set ID...")
    social_set_id = get_social_set_id()
    if not social_set_id:
        print("❌ Could not get social set ID from Typefully")
        print("   Make sure your API key is valid and you have at least one social set")
        sys.exit(1)
    print(f"✓ Got social set ID: {social_set_id}\n")

    # Parse posts
    posts = parse_markdown(markdown_file)
    print(f"✓ Found {len(posts)} posts\n")

    if not posts:
        print("❌ No posts found in markdown file")
        sys.exit(1)

    # Process each post
    pushed_count = 0
    pending_images = []

    for post in posts:
        print(f"Processing: {post['title']}")

        # Match image
        img_path = match_image(post['img_codename']) if post['img_codename'] else None

        if post['img_codename'] and not img_path:
            print(f"  ⚠️  Image pending: {post['img_codename']}.png")
            pending_images.append(post['img_codename'])

        # Push to Typefully
        if push_to_typefully(post, img_path, social_set_id):
            pushed_count += 1

        print()

    # Summary
    print("=" * 50)
    print(f"✓ Pushed {pushed_count}/{len(posts)} posts to Typefully")

    if pending_images:
        print(f"\n⚠️  Pending images ({len(pending_images)}):")
        for img in pending_images:
            print(f"  - {img}.png")
        print("\nCreate these images and re-run the script.")

    print("=" * 50)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/sync_typefully.py output/linkedin/2025-01-12.md")
        sys.exit(1)

    main(sys.argv[1])

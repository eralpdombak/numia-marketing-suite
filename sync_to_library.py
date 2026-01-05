"""
Sync generated content from markdown files to Supabase library
"""

import os
import re
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('frontend/.env')

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing Supabase credentials in frontend/.env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

OUTPUT_DIRS = {
    "linkedin": "output/linkedin-posts",
    "twitter": "output/twitter-threads",
    "blog": "output/blog-posts",
    "newsletter": "output/newsletters",
    "email": "output/emails"
}

CONTENT_INDEX = "content_index.json"


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
    # Try to find the first heading
    match = re.search(r'^#\s+(.+?)$', content, re.MULTILINE)
    if match:
        # Clean up the title - remove "LinkedIn Post:" prefix if present
        title = match.group(1)
        title = re.sub(r'^LinkedIn Post:\s*', '', title)
        return title.strip()

    # Fallback to filename-based title
    return "Untitled Post"


def sync_to_supabase():
    """Sync new content from markdown files to Supabase"""
    index = load_index()
    synced_count = 0

    for platform, directory in OUTPUT_DIRS.items():
        if not os.path.exists(directory):
            print(f"⏭️  Skipping {platform} (directory doesn't exist)")
            continue

        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)

            # Skip directories and hidden files
            if not os.path.isfile(filepath) or filename.startswith('.'):
                continue

            # Check if already synced
            file_key = f"synced_{filepath}"
            if file_key in index.get("tracked_files", {}):
                # Check if the item still exists in Supabase (wasn't deleted)
                synced_id = index["tracked_files"][file_key].get("supabase_id")
                if synced_id:
                    try:
                        result = supabase.table("library_items").select("id").eq("id", synced_id).execute()
                        if result.data and len(result.data) > 0:
                            # Item still exists, skip
                            continue
                        else:
                            # Item was deleted from Supabase, remove from index AND delete the file
                            print(f"🗑️  Item was deleted from library, removing file: {filename}")
                            del index["tracked_files"][file_key]
                            save_index(index)
                            # Delete the markdown file too
                            try:
                                os.remove(filepath)
                                print(f"  ✓ Deleted file: {filepath}")
                            except Exception as delete_error:
                                print(f"  ⚠️  Failed to delete file: {delete_error}")
                            continue
                    except Exception as e:
                        print(f"⚠️  Error checking item existence: {e}")
                        continue
                else:
                    # Already synced and no ID to check, skip
                    continue

            print(f"📤 Syncing {platform}: {filename}")

            # Read content
            with open(filepath, 'r') as f:
                full_content = f.read()

            # Extract post copy and title
            if platform in ['linkedin', 'twitter', 'email']:
                content = extract_post_copy(full_content)
                title = extract_title(full_content)
            else:
                content = full_content
                title = extract_title(full_content)

            # Insert into Supabase
            try:
                data = {
                    "type": "text",
                    "content": content,
                    "platform": platform,
                    "title": title,
                    "created_at": datetime.utcnow().isoformat()
                }

                result = supabase.table("library_items").insert(data).execute()

                # Mark as synced
                if "tracked_files" not in index:
                    index["tracked_files"] = {}

                index["tracked_files"][file_key] = {
                    "synced_at": datetime.now().isoformat(),
                    "platform": platform,
                    "filename": filename,
                    "supabase_id": result.data[0]['id'] if result.data else None
                }

                synced_count += 1
                print(f"  ✓ Synced to Supabase")

            except Exception as e:
                print(f"  ✗ Failed to sync: {e}")

    if synced_count > 0:
        save_index(index)
        print(f"\n✅ Synced {synced_count} new item(s) to library")
    else:
        print("\n✓ No new content to sync")

    return synced_count


if __name__ == "__main__":
    sync_to_supabase()

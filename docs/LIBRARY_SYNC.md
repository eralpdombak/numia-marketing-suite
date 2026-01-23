# Library Auto-Sync

## How it works

All content generation slash commands (`/linkedin`, `/twitter`, `/blog`, `/email`) now automatically sync to the Library database after generating content.

### Workflow (Automatic Bidirectional Sync)

1. **Generate content** using a slash command (e.g., `/linkedin a post about blockchain`)
2. **Sync runs FIRST** - detects and cleans up any deletions from the Library
3. **Content is saved** to markdown file in `/output/[platform]-posts/`
4. **Sync runs AGAIN** - adds new content to the Library database
5. **Content appears in Library** - refresh the frontend to see it

### Deletion (Automatic Cleanup)

When you delete content from the Library frontend:
- It's deleted from Supabase immediately
- Next time you run ANY slash command, sync runs first and deletes the markdown file
- The tracking index is updated

This means:
✅ Delete in Library → Generate any new content → File gets removed automatically
✅ No manual sync needed
✅ No orphaned markdown files
✅ No risk of deleted content coming back

### Manual Sync

If auto-sync doesn't run for some reason, you can manually sync:

```bash
./venv/bin/python3 sync_to_library.py
```

### Database Modes

- **Cloud mode** (default): Uses Supabase, configured in `frontend/.env`
- **Local mode**: Set `VITE_LOCAL_MODE=true` in `frontend/.env.local` to use local API server

### Supported Platforms

- LinkedIn posts → `output/linkedin-posts/`
- Twitter threads → `output/twitter-threads/`
- Blog posts → `output/blog-posts/`
- Newsletters → `output/newsletters/`
- Email campaigns → `output/emails/`

## Troubleshooting

**Content not showing up in Library?**
1. Check that `sync_to_library.py` ran successfully
2. Refresh the Library page in frontend
3. Check Supabase credentials in `frontend/.env`

**Deleted content keeps coming back?**
- This shouldn't happen anymore - the sync script now detects deletions
- If it does, delete the item from both Library AND the markdown file in `/output/`

# Deploy Generate-Content Edge Function

The frontend is currently using an outdated edge function. Deploy the updated version to get high-quality output with full intelligence guidelines.

## Quick Deploy (One Command)

```bash
./DEPLOY.sh
```

## Manual Steps

If the script doesn't work, follow these steps:

### 1. Login to Supabase (one-time)
```bash
cd frontend
npx supabase login
```
This opens your browser to authenticate.

### 2. Set the ANTHROPIC_API_KEY secret
```bash
npx supabase secrets set ANTHROPIC_API_KEY=your_anthropic_key_here --project-ref qkqqajnawatqxjmuecsw
```

Or via dashboard: https://supabase.com/dashboard/project/qkqqajnawatqxjmuecsw/settings/functions

### 3. Deploy the function
```bash
npx supabase functions deploy generate-content --project-ref qkqqajnawatqxjmuecsw
```

## What This Fixes

The updated `generate-content` function includes:

✅ **Claude Sonnet 4** instead of Gemini (much better instruction following)
✅ **Full 776 lines of intelligence guidelines** embedded (LinkedIn + Twitter)
✅ **Strict output format rules** (no meta-commentary, no markdown, clean text only)
✅ **Streaming support** for real-time content generation

After deployment, the frontend Notes page will produce the same high-quality output as your backend slash commands.

## Verify It Works

1. Go to the Notes page
2. Select "LinkedIn Post"
3. Enter: "We hit 5B monthly API requests"
4. Click Generate

You should see a clean, professional LinkedIn post with NO "Here's an option" or formatting symbols.

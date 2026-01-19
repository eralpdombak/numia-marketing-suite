/**
 * Local Content API Server with AI Content Generation
 * Serves content from content_index.json to React frontend
 * Runs on http://localhost:3001
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CONTENT_INDEX = path.join(__dirname, 'content_index.json');
const OUTPUT_DIR = path.join(__dirname, 'output');

// Platform mapping
const platformMap = {
  'blog': 'blog',
  'linkedin': 'linkedin',
  'twitter': 'twitter',
  'newsletter': 'newsletter'
};

// Load intelligence guidelines
const LINKEDIN_GUIDELINES = `# CRITICAL OUTPUT FORMAT RULE

YOU MUST OUTPUT ONLY THE FINAL POST TEXT. NO META-COMMENTARY. NO OPTIONS. NO FORMATTING SYMBOLS.

Do NOT include:
- "Here's a post"
- "Here are options"
- "Option 1:", "Option 2:"
- Any **bold**, *italic*, or markdown
- Any explanatory text
- Any commentary about the post
- ABSOLUTELY NO meta-commentary like "I've created..." or "The post:"

ONLY output the exact text that will be published on LinkedIn. Nothing else. Start IMMEDIATELY with the post content.

---

` + require('fs').readFileSync(path.join(__dirname, 'intelligence/post-guidelines/linkedin-guidelines.md'), 'utf-8') + `

---

# FINAL REMINDER - OUTPUT FORMAT

START YOUR RESPONSE IMMEDIATELY WITH THE POST TEXT.

Do NOT write:
- "Here's a post about..."
- "Option 1:"
- "**Bold text**"
- "I've created..."
- "The post:"
- Any meta-commentary whatsoever

Just write the post. Plain text. No formatting. No introduction.`;

const TWITTER_GUIDELINES = `# CRITICAL OUTPUT FORMAT RULE

YOU MUST OUTPUT ONLY THE FINAL THREAD TEXT. NO META-COMMENTARY. NO OPTIONS. NO FORMATTING SYMBOLS.

Do NOT include:
- "Here's a thread"
- "Here are options"
- "Option 1:", "Option 2:"
- Any **bold**, *italic*, or markdown
- Any explanatory text
- Any commentary about the thread
- ABSOLUTELY NO meta-commentary like "I've created..." or "The thread:"

ONLY output the exact text that will be published on Twitter/X. Nothing else. Start IMMEDIATELY with the first tweet.

---

` + require('fs').readFileSync(path.join(__dirname, 'intelligence/post-guidelines/twitter-guidelines.md'), 'utf-8') + `

---

# FINAL REMINDER - OUTPUT FORMAT

START YOUR RESPONSE IMMEDIATELY WITH THE FIRST TWEET.

Do NOT write:
- "Here's a thread about..."
- "Option 1:"
- "**Bold text**"
- "Tweet 1:"
- "I've created..."
- Any meta-commentary whatsoever

Just write the thread. Plain text. No formatting. No introduction. Each tweet separated by a blank line.`;

/**
 * POST /api/generate-content
 * Generates content using Anthropic Claude API with full intelligence guidelines
 */
app.post('/api/generate-content', async (req, res) => {
  try {
    const { prompt, platform } = req.body;

    if (!prompt || !platform) {
      return res.status(400).json({ error: 'prompt and platform required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    // Select guidelines based on platform
    let systemPrompt;
    if (platform === 'linkedin') {
      systemPrompt = LINKEDIN_GUIDELINES;
    } else if (platform === 'twitter') {
      systemPrompt = TWITTER_GUIDELINES;
    } else {
      systemPrompt = `You are a ${platform} content writer. Create engaging content. Output ONLY the final content text with NO meta-commentary.`;
    }

    // Set response headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Create streaming request to Anthropic
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `CRITICAL INSTRUCTIONS - READ FIRST:

1. Output ONLY the final ${platform} post/thread text
2. NO "Here's a post", NO "Option 1:", NO meta-commentary
3. NO markdown formatting (**bold**, *italic*, etc.)
4. NO emojis unless the user specifically requests them
5. Start your response IMMEDIATELY with the post content
6. Plain text only with line breaks for white space
7. ABSOLUTELY NO phrases like "I've created..." or "The post:" or "Key elements:"

User's brain dump:
${prompt}

Remember: Output the EXACT TEXT that will be published. Nothing else. Start NOW with the content.`
      }]
    });

    // Stream the response
    stream.on('text', (text) => {
      // Convert to OpenAI-compatible format for frontend
      const chunk = {
        choices: [{
          delta: {
            content: text
          }
        }]
      };
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });

    stream.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('Error generating content:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * GET /api/content
 * Returns all content from content_index.json in Supabase-compatible format
 */
app.get('/api/content', async (req, res) => {
  try {
    const data = await fs.readFile(CONTENT_INDEX, 'utf-8');
    const index = JSON.parse(data);

    // Transform to Supabase format
    const items = Object.entries(index.tracked_files || {}).map(([filepath, meta]) => ({
      id: Buffer.from(filepath).toString('base64'),
      type: 'text',
      content: meta.title || meta.filename,
      platform: platformMap[meta.content_type] || meta.content_type,
      title: meta.title || meta.filename,
      created_at: meta.tracked_at,
      filepath: filepath,
    }));

    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(items);
  } catch (error) {
    console.error('Error reading content index:', error);
    res.json([]);
  }
});

/**
 * GET /api/content/:id
 * Returns full content for a specific item
 */
app.get('/api/content/:id', async (req, res) => {
  try {
    const filepath = Buffer.from(req.params.id, 'base64').toString();
    const indexData = await fs.readFile(CONTENT_INDEX, 'utf-8');
    const index = JSON.parse(indexData);
    const meta = index.tracked_files[filepath];

    if (!meta) {
      return res.status(404).json({ error: 'Content not found in index' });
    }

    let content;
    if (meta.display_content) {
      content = meta.display_content;
    } else {
      content = await fs.readFile(filepath, 'utf-8');
    }

    res.json({
      id: req.params.id,
      type: 'text',
      content: content,
      platform: platformMap[meta.content_type] || meta.content_type,
      title: meta.title || meta.filename,
      created_at: meta.tracked_at,
    });
  } catch (error) {
    console.error('Error reading content:', error);
    res.status(404).json({ error: 'Content not found' });
  }
});

/**
 * DELETE /api/content/:id
 */
app.delete('/api/content/:id', async (req, res) => {
  try {
    const filepath = Buffer.from(req.params.id, 'base64').toString();
    await fs.unlink(filepath);

    const indexData = await fs.readFile(CONTENT_INDEX, 'utf-8');
    const index = JSON.parse(indexData);
    delete index.tracked_files[filepath];
    await fs.writeFile(CONTENT_INDEX, JSON.stringify(index, null, 2));

    res.json({ success: true, message: 'Content deleted' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

/**
 * DELETE /api/content (bulk)
 */
app.delete('/api/content', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids array required' });
    }

    const indexData = await fs.readFile(CONTENT_INDEX, 'utf-8');
    const index = JSON.parse(indexData);

    for (const id of ids) {
      try {
        const filepath = Buffer.from(id, 'base64').toString();
        await fs.unlink(filepath);
        delete index.tracked_files[filepath];
      } catch (error) {
        console.error(`Failed to delete ${id}:`, error.message);
      }
    }

    await fs.writeFile(CONTENT_INDEX, JSON.stringify(index, null, 2));
    res.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'local',
    timestamp: new Date().toISOString(),
    anthropic_configured: !!process.env.ANTHROPIC_API_KEY
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Local Content API Server (AI-Powered)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ Running on http://localhost:${PORT}`);
  console.log(`✓ Serving from: ${CONTENT_INDEX}`);
  console.log(`✓ Anthropic API: ${process.env.ANTHROPIC_API_KEY ? 'Configured ✓' : 'NOT CONFIGURED ✗'}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET    /health                - Health check`);
  console.log(`  GET    /api/content           - List all content`);
  console.log(`  GET    /api/content/:id       - Get specific content`);
  console.log(`  POST   /api/generate-content  - AI content generation (Claude Sonnet 4)`);
  console.log(`  DELETE /api/content/:id       - Delete content`);
  console.log(`  DELETE /api/content           - Bulk delete`);
  console.log('');
  console.log('Press CTRL+C to stop');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

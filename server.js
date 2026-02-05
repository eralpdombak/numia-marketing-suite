/**
 * Local Content API Server
 * Serves content from content_index.json to React frontend
 * Runs on http://localhost:3001
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static images
app.use('/library-images', express.static(path.join(__dirname, 'public/library-images')));

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
      id: Buffer.from(filepath).toString('base64'), // Use filepath as unique ID
      type: 'text',
      content: meta.title || meta.filename, // Preview - show title only
      platform: platformMap[meta.content_type] || meta.content_type,
      title: meta.title || meta.filename,
      created_at: meta.tracked_at,
      filepath: filepath, // Store for later retrieval
    }));

    // Sort by created_at descending (newest first)
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(items);
  } catch (error) {
    console.error('Error reading content index:', error);
    // Return empty array if file doesn't exist yet
    res.json([]);
  }
});

/**
 * GET /api/content/:id
 * Returns full content for a specific item
 */
app.get('/api/content/:id', async (req, res) => {
  try {
    // Decode filepath from ID
    const filepath = Buffer.from(req.params.id, 'base64').toString();

    // Read metadata from index
    const indexData = await fs.readFile(CONTENT_INDEX, 'utf-8');
    const index = JSON.parse(indexData);
    const meta = index.tracked_files[filepath];

    if (!meta) {
      return res.status(404).json({ error: 'Content not found in index' });
    }

    // Use display_content if available (for social media posts)
    // Otherwise read the full file
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
 * Deletes content file and removes from index
 */
app.delete('/api/content/:id', async (req, res) => {
  try {
    // Decode filepath from ID
    const filepath = Buffer.from(req.params.id, 'base64').toString();

    // Delete the actual file
    await fs.unlink(filepath);

    // Update content index
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
 * DELETE /api/content (bulk delete)
 * Deletes multiple content items
 */
app.delete('/api/content', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids array required' });
    }

    // Read index once
    const indexData = await fs.readFile(CONTENT_INDEX, 'utf-8');
    const index = JSON.parse(indexData);

    // Delete each file and remove from index
    for (const id of ids) {
      try {
        const filepath = Buffer.from(id, 'base64').toString();
        await fs.unlink(filepath);
        delete index.tracked_files[filepath];
      } catch (error) {
        console.error(`Failed to delete ${id}:`, error.message);
        // Continue with other deletions
      }
    }

    // Write updated index once
    await fs.writeFile(CONTENT_INDEX, JSON.stringify(index, null, 2));

    res.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

/**
 * GET /api/changelog
 * Returns parsed changelog from CHANGELOG.md
 */
app.get('/api/changelog', async (req, res) => {
  try {
    const changelogPath = path.join(__dirname, 'CHANGELOG.md');
    const content = await fs.readFile(changelogPath, 'utf-8');

    // Parse markdown changelog
    const entries = [];
    const lines = content.split('\n');
    let currentDate = null;
    let currentSection = null;
    let currentChanges = [];

    for (const line of lines) {
      // Match date headers like ## [2025-01-11]
      const dateMatch = line.match(/^## \[(.+?)\]/);
      if (dateMatch) {
        // Save previous entry
        if (currentDate && currentChanges.length > 0) {
          entries.push({
            date: currentDate,
            changes: currentChanges
          });
        }
        currentDate = dateMatch[1];
        currentChanges = [];
        currentSection = null;
        continue;
      }

      // Match section headers like ### Added
      const sectionMatch = line.match(/^### (.+)/);
      if (sectionMatch) {
        currentSection = sectionMatch[1].toLowerCase();
        continue;
      }

      // Match bullet points like - Something changed
      const changeMatch = line.match(/^- (.+)/);
      if (changeMatch && currentSection && currentDate) {
        currentChanges.push({
          type: currentSection,
          text: changeMatch[1]
        });
      }
    }

    // Add last entry
    if (currentDate && currentChanges.length > 0) {
      entries.push({
        date: currentDate,
        changes: currentChanges
      });
    }

    res.json(entries);
  } catch (error) {
    console.error('Error reading changelog:', error);
    res.status(500).json({ error: 'Failed to read changelog' });
  }
});

/**
 * Generate blog content using Anthropic API directly
 * Bypasses slash command system which was causing meta-commentary issues
 */
async function generateBlogWithAnthropicAPI(req, res, userPrompt) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Ultra-strict system prompt that forces Claude to start with # immediately
  const systemPrompt = `YOU ARE A BLOG POST GENERATOR. OUTPUT ONLY THE BLOG POST.

YOUR FIRST CHARACTER MUST BE: #

FORBIDDEN - NEVER WRITE:
- "Here's a blog post"
- "I've created"
- "**Title:**"
- "What makes this work"
- "Key elements"
- "Structure:"
- "This blog post"
- ANY analysis
- ANY explanation
- ANY meta-commentary

REQUIRED:
- Start IMMEDIATELY with: # [Blog Headline]
- Write ONLY the blog post content
- End immediately when post ends
- ZERO commentary before or after

Write a comprehensive blog post (1200-2000 words) for Numia (Data Blockchain Cloud).
Target: Web3 developers, blockchain founders, data engineers.
Tone: Technical but conversational.

OUTPUT ONLY THE BLOG POST. START WITH # NOW.`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 1,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        const openaiFormat = {
          choices: [{
            delta: {
              content: chunk.delta.text
            }
          }]
        };
        res.write(`data: ${JSON.stringify(openaiFormat)}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Anthropic API error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

/**
 * Generate email content using Anthropic API directly
 * Bypasses slash command system which was causing meta-commentary issues
 */
async function generateEmailWithAnthropicAPI(req, res, userPrompt) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const systemPrompt = `YOU ARE AN EMAIL GENERATOR. OUTPUT ONLY THE EMAIL.

FORBIDDEN - NEVER WRITE:
- "Here's an email"
- "I've created"
- "The email needs your permission"
- "Should I proceed"
- "Would you like"
- "What makes this work"
- "**Subject:**"
- ANY analysis
- ANY explanation
- ANY meta-commentary

REQUIRED:
- Start IMMEDIATELY with: Subject: [Email Subject Line]
- Write ONLY the email content
- End immediately when email ends
- ZERO commentary before or after

Write a marketing email for Numia (Data Blockchain Cloud).
Target: Web3 developers, blockchain founders.
Tone: Professional but conversational.

OUTPUT ONLY THE EMAIL. START NOW.`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 1,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        const openaiFormat = {
          choices: [{
            delta: {
              content: chunk.delta.text
            }
          }]
        };
        res.write(`data: ${JSON.stringify(openaiFormat)}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Anthropic API error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

/**
 * Generate LinkedIn content using Anthropic API directly
 * Bypasses slash command system which was causing meta-commentary issues
 */
async function generateLinkedInWithAnthropicAPI(req, res, userPrompt) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const systemPrompt = `YOU ARE A LINKEDIN POST GENERATOR. OUTPUT ONLY THE POST TEXT.

FORBIDDEN - NEVER WRITE:
- "Here's a LinkedIn post"
- "I've created"
- "This post"
- "What makes this work"
- "Hook:"
- "Structure:"
- "Why this works"
- "Key elements"
- ANY analysis
- ANY explanation
- ANY meta-commentary

REQUIRED:
- Write ONLY the LinkedIn post text
- Start with the first word of the post
- End immediately when post ends
- ZERO commentary before or after

Write a LinkedIn post for Numia (Data Blockchain Cloud).
Target: Web3 developers, blockchain founders.
Tone: Conversational, peer-to-peer.

OUTPUT ONLY THE POST TEXT. START NOW.`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 1,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        const openaiFormat = {
          choices: [{
            delta: {
              content: chunk.delta.text
            }
          }]
        };
        res.write(`data: ${JSON.stringify(openaiFormat)}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Anthropic API error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

/**
 * Generate Twitter content using Anthropic API directly
 */
async function generateTwitterWithAnthropicAPI(req, res, userPrompt) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const systemPrompt = `YOU ARE A TWITTER THREAD GENERATOR. OUTPUT ONLY THE TWEET TEXT.

FORBIDDEN - NEVER WRITE:
- "Here's a thread"
- "I've created"
- "This thread"
- "What makes this work"
- "Hook:"
- "Structure:"
- "Why this works"
- ANY analysis
- ANY explanation
- ANY meta-commentary

REQUIRED:
- Write ONLY the Twitter thread text
- Start with the first tweet
- Separate tweets with "---" on its own line
- End immediately when thread ends
- ZERO commentary before or after

Write a Twitter thread for Numia (Data Blockchain Cloud).
Target: Web3 developers, blockchain founders.
Tone: Direct, conversational.

OUTPUT ONLY THE THREAD TEXT. START NOW.`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 1,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
        const openaiFormat = {
          choices: [{
            delta: {
              content: chunk.delta.text
            }
          }]
        };
        res.write(`data: ${JSON.stringify(openaiFormat)}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Anthropic API error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}

/**
 * POST /api/generate-content
 * Generates content using local slash commands
 */
app.post('/api/generate-content', async (req, res) => {
  try {
    const { prompt, platform } = req.body;

    if (!prompt || !platform) {
      return res.status(400).json({ error: 'prompt and platform required' });
    }

    // Map platform to slash command
    // Note: Slash commands (.claude/commands/*.md) have comprehensive instructions built-in
    // DO NOT load additional guidelines - they conflict with slash command instructions
    const platformConfig = {
      'linkedin': '/linkedin',
      'twitter': '/twitter',
      'blog': '/blog',
      'email': '/email',
      'newsletter': '/newsletter'
    };

    const slashCommand = platformConfig[platform];
    if (!slashCommand) {
      return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }

    // Use Anthropic API directly for ALL platforms with strict system prompts
    // Slash commands are being ignored and causing meta-commentary instead of content
    if (platform === 'blog') {
      return await generateBlogWithAnthropicAPI(req, res, prompt);
    }

    if (platform === 'email') {
      return await generateEmailWithAnthropicAPI(req, res, prompt);
    }

    if (platform === 'linkedin') {
      return await generateLinkedInWithAnthropicAPI(req, res, prompt);
    }

    if (platform === 'twitter') {
      return await generateTwitterWithAnthropicAPI(req, res, prompt);
    }

    // Set response headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Execute slash command and stream output
    const { spawn } = require('child_process');
    const claudeProcess = spawn('claude', ['--output-format', 'text'], {
      cwd: __dirname,
      env: { ...process.env }
    });

    // Send slash command with user prompt directly
    // DO NOT append guidelines - the slash command already has comprehensive instructions
    // Adding guidelines causes Claude to describe the structure instead of writing content
    const fullPrompt = `${slashCommand} ${prompt}\n`;

    claudeProcess.stdin.write(fullPrompt);
    claudeProcess.stdin.end();

    // Buffer for accumulating output
    let buffer = '';
    let hasStartedSending = false;

    // AGGRESSIVE: Block ALL meta-commentary before content starts
    const preContentMetaPatterns = [
      // Acknowledgments and meta-discussion (BLOCK FIRST)
      /^Done\./i,
      /^Got it/i,
      /^Okay/i,
      /^Alright/i,
      /^Perfect/i,
      /^Great[!.]/i,
      /^Understood/i,
      /^Now I/i,  // Catches "Now I'll", "Now I have", "Now I understand", etc.
      // Questions asking for clarification (BLOCK THESE IMMEDIATELY)
      /^I need more context/i,
      /^I need additional/i,
      /^I need to/i,
      /^Could you provide/i,
      /^Could you/i,
      /^What's the/i,
      /^What is the/i,
      /^What would you/i,
      /^Give me/i,
      /^Can you/i,
      /^Would you/i,
      /Some options/i,
      /^What topic/i,
      /^What should/i,
      /^For example/i,
      /^For reference/i,
      /are we talking about/i,
      /Are you looking/i,
      /Give me the angle/i,
      /Give me the context/i,
      /^Tell me/i,
      /^Share/i,
      /^Which/i,
      /Something else entirely/i,
      /looking to promote/i,
      /standalone thought/i,
      /specific from recent/i,
      /I can see from your/i,
      // File/system references
      /The system is asking/i,
      /write access/i,
      /create the file/i,
      /save the file/i,
      /file at \/Users/i,
      /output\/blog-posts/i,
      /\.md$/i,
      // Regular meta-commentary
      /^I need permission/i,
      /^I need to/i,
      /^I want to/i,
      /^I should/i,
      /^I can deliver/i,
      /^I can provide/i,
      /^I can create/i,
      /^I can't/i,
      /^I cannot/i,
      /^However, I can/i,
      /^Let me craft/i,
      /^Let me create/i,
      /^Let me write/i,
      /^Let me deliver/i,
      /^Let me make/i,
      /^Let me/i,
      /^I'm going to/i,
      /^I'll make/i,
      /^I'll/i,
      /^I've/i,
      /^Sure,?/i,
      /^Certainly,?/i,
      /^Of course,?/i,
      /^Here's/i,
      /^Here are/i,
      /^Here is/i,
      /^This is/i,
      /^Below is/i,
      /^Option \d+/i,
      /^Post \d+/i,
      /^Thread \d+/i,
      /^Tweet \d+/i,
      /^Version \d+/i,
      /^Draft/i,
      /^---+$/,
      /^===+$/,
      /^___+$/,
      /^🧵/,
      /^\d+\./,  // Numbered lists (often questions)
      /^-\s+/,   // Bullet points (often meta-analysis lists)
      /needs to:/i,  // "The post needs to:"
      /should:/i,    // "should include:"
      /must:/i,      // "must have:"
      /following the/i,  // "following the guidelines"
      /^The post/i,  // "The post needs to..."
      /^The thread/i,  // "The thread should..."
      /^The blog/i,    // "The blog must..."
      /^The structure/i,  // "The structure covers..."
      /^\*\*.*\*\*:?$/i,  // Lines that are just **Bold Text:** (markdown headers)
      /^I've created a/i,  // "I've created a comprehensive blog post..."
      /hits hard on/i,  // "The post hits hard on..."
      /^Making it/i,  // "Making it personal"
      /^Showing /i,  // "Showing competitive advantage"
      /^Exposing /i,  // "Exposing the hidden cost"
      /^Opening with/i,  // "Opening with a real scenario"
      /^Concrete examples/i,  // "Concrete examples"
      /^\d+\.\s+\*\*/i,  // Numbered lists with bold like "1. **Something**"
      /^Structure:/i,  // "Structure: Opens with..."
      /^Hook Strategy:/i,  // "Hook Strategy: Uses..."
      /^Tone:/i,  // "Tone: Conversational and..."
      /^FOMO Triggers:/i,  // "FOMO Triggers:"
      /^Product Coverage:/i,  // "Product Coverage: Woven..."
      /^Avoids AI Tells:/i,  // "Avoids AI Tells:"
      /^Would you like me to/i,  // "Would you like me to save..."
      /^No "moreover,"/i,  // "No 'moreover,' 'furthermore'..."
      /^Should I proceed/i,  // "Should I proceed with saving..."
      /^FIX IT/i,  // User's frustration (shouldn't be in output)
      /^\*\*Title:\*\*/i,  // "**Title:**"
      /^\*\*What I've crafted:\*\*/i,  // "**What I've crafted:**"
      /^\*\*Key Elements:\*\*/i,  // "**Key Elements:**"
      /^\*\*Structure:\*\*/i,  // "**Structure:**"
      /^\*\*Target Audience/i,  // "**Target Audience Pain Points:**"
      /^-\s+\*\*Creates urgency\*\*/i,  // Bullet points with bold
      /^-\s+\*\*Quantifies/i,
      /^-\s+\*\*Highlights/i,
      /^-\s+\*\*Builds FOMO\*\*/i,
      /^-\s+\*\*Demonstrates/i,
      /^-\s+\*\*Showcases/i,
      /^-\s+Data fragmentation/i,
      /^-\s+Inability to answer/i,
      /^-\s+Manual data processes/i,
      /^-\s+Competitive disadvantage/i,
      /^-\s+Missing opportunities/i,
      /^The post needs your permission/i,
      /^-\s+SEO-optimized/i,
      /^-\s+Scannable/i,
      /^-\s+Provocative but/i,
      /^-\s+Ends with strong/i,
      /^\d+\+? words/i,  // "2,400+ words"
      /^10-minute read/i,
    ];

    // NUCLEAR: Patterns that indicate meta-analysis AFTER content
    // If we see these, STOP streaming immediately (content is done, rest is commentary)
    const postContentMetaPatterns = [
      // Blog-specific meta-commentary (MOST COMMON)
      /^[!?]?\s*I'?ve\s+created\s+a\s+blog\s+post/i,
      /^Unique\s+aspects?:/i,
      /^Human\s+touches?\s+(?:added|included)?:/i,
      /^Human\s+Touch\s+Elements:/i,
      /^Variation\s+Elements?\s+Used:/i,
      /^No\s+Numia\s+pitch/i,
      /^The\s+focus\s+is/i,
      /^Length:/i,
      /^~?\d+[,\d]*\s+words?\s/i,

      // Section headers for analysis
      /^Key elements I/i,
      /^Key elements:/i,
      /^The Hook:/i,
      /^Hook:/i,
      /^Structure:/i,
      /^Tone:/i,
      /^Voice:/i,
      /^Style:/i,
      /^Variation techniques/i,
      /^Human touches:/i,
      /^Human elements:/i,
      /^FOMO Elements:/i,
      /^Product Integration:/i,
      /^Call to Action:/i,
      /^Why this works:/i,
      /^What makes this/i,
      /^What makes \w+ unique:/i,

      // "This [content type]..." analysis
      /^This post/i,
      /^This thread/i,
      /^This approach/i,
      /^This article/i,
      /^This blog/i,
      /^The post explains/i,
      /^The article/i,
      /^The blog post is/i,

      // "I [verb]..." explanations
      /^I used/i,
      /^I included/i,
      /^I incorporated/i,
      /^I baked in/i,
      /^I've created/i,

      // Word count and meta info
      /^Word count:/i,
      /^Character count:/i,
      /approximately \d+ words/i,
      /^It's approximately/i,
      /it's a ~?\d+[,\d]* word/i,
      /This is a ~?\d+[,\d]* word/i,
      /word piece that/i,

      // Analysis bullet points
      /^-\s+(?:Structure|Hook|Tone|Length|Human touches|Opinion|Code example|Sentence|Rule-breaking|Specific|Real developer|Conversational):/i,

      // Other meta patterns
      /maintains engagement/i,
      /^Opens with/i,
      /^Positioning/i,
      /^Real technical details/i,
      /^Subheadings that/i,
      /^No AI clich/i,
      /without feeling like/i,
      /The blog post is ready/i,
      /The post is ready/i,
      /^Should I proceed/i,
      /^Would you like me to/i,
    ];

    const shouldSkipPreContentLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      // Only check if we haven't started sending content yet
      return preContentMetaPatterns.some(pattern => pattern.test(trimmed));
    };

    const isPostContentMeta = (text) => {
      return postContentMetaPatterns.some(pattern => pattern.test(text));
    };

    let fullAccumulatedContent = '';

    claudeProcess.stdout.on('data', (data) => {
      const text = data.toString();
      buffer += text;
      fullAccumulatedContent += text;

      // Check the FULL accumulated content for post-content meta patterns
      if (hasStartedSending && isPostContentMeta(fullAccumulatedContent)) {
        console.log('🛑 Detected post-content meta-analysis in accumulated content');
        // Stop the Claude process
        claudeProcess.kill();
        // Send final marker and end response
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      // Process line by line to skip only initial meta-commentary
      const lines = buffer.split('\n');

      // Keep the last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {

        // Only skip pre-content meta-commentary
        if (!hasStartedSending) {
          const isPreContentMeta = shouldSkipPreContentLine(line);

          if (isPreContentMeta) {
            console.log('Skipped pre-content meta:', line.substring(0, 50));
            continue;
          }

          // Start sending once we hit actual content
          if (line.trim()) {
            console.log('Starting content stream at:', line.substring(0, 50));
            hasStartedSending = true;
          }
        }

        // Once we've started, send EVERYTHING (frontend will clean it)
        if (hasStartedSending) {
          const lineWithNewline = line + '\n';
          // Send each character as streaming chunk in OpenAI format
          for (const char of lineWithNewline) {
            const chunk = {
              choices: [{
                delta: {
                  content: char
                }
              }]
            };
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
        }
      }
    });

    claudeProcess.stderr.on('data', (data) => {
      console.error('Claude error:', data.toString());
    });

    claudeProcess.on('close', (code) => {
      // Send any remaining buffered content (frontend will clean it)
      if (buffer.trim() && hasStartedSending) {
        for (const char of buffer) {
          const chunk = {
            choices: [{
              delta: {
                content: char
              }
            }]
          };
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    });

    claudeProcess.on('error', (error) => {
      console.error('Failed to start Claude process:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/intelligence
 * Returns intelligence directory structure
 */
app.get('/api/intelligence', async (req, res) => {
  try {
    const intelligenceDir = path.join(__dirname, 'intelligence');
    const structure = {};

    // Read all subdirectories
    const folders = await fs.readdir(intelligenceDir);

    for (const folder of folders) {
      const folderPath = path.join(intelligenceDir, folder);
      const stat = await fs.stat(folderPath);

      if (stat.isDirectory()) {
        const files = await fs.readdir(folderPath);
        structure[folder] = files
          .filter(f => f.endsWith('.md'))
          .map(f => ({
            name: f,
            path: `intelligence/${folder}/${f}`,
            folder: folder
          }));
      }
    }

    res.json(structure);
  } catch (error) {
    console.error('Error reading intelligence directory:', error);
    res.status(500).json({ error: 'Failed to read intelligence directory' });
  }
});

/**
 * GET /api/intelligence/file
 * Returns content of a specific intelligence file
 */
app.get('/api/intelligence/file', async (req, res) => {
  try {
    const { path: filePath } = req.query;

    if (!filePath || !filePath.startsWith('intelligence/')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const fullPath = path.join(__dirname, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');

    res.json({ content, path: filePath });
  } catch (error) {
    console.error('Error reading intelligence file:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

/**
 * PUT /api/intelligence/file
 * Saves changes to an intelligence file
 */
app.put('/api/intelligence/file', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;

    if (!filePath || !filePath.startsWith('intelligence/')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }

    const fullPath = path.join(__dirname, filePath);

    // Verify file exists before overwriting
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    await fs.writeFile(fullPath, content, 'utf-8');

    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error saving intelligence file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

/**
 * POST /api/braindump
 * Process braindump and generate intelligence suggestions
 */
app.post('/api/braindump', async (req, res) => {
  try {
    const { braindump } = req.body;

    if (!braindump || typeof braindump !== 'string') {
      return res.status(400).json({ error: 'braindump text required' });
    }

    // Read existing intelligence structure
    const intelligenceDir = path.join(__dirname, 'intelligence');
    const structure = {};
    const folders = await fs.readdir(intelligenceDir);

    for (const folder of folders) {
      const folderPath = path.join(intelligenceDir, folder);
      const stat = await fs.stat(folderPath);

      if (stat.isDirectory()) {
        const files = await fs.readdir(folderPath);
        structure[folder] = files.filter(f => f.endsWith('.md'));
      }
    }

    // Create prompt for Claude to analyze and organize the braindump
    const prompt = `You are an intelligence organization assistant. Analyze the following braindump and organize it into structured information that should be added to our intelligence files.

Available intelligence structure:
${JSON.stringify(structure, null, 2)}

Braindump:
${braindump}

Your task:
1. Analyze the braindump and extract key information
2. Determine which intelligence files should be updated
3. For each piece of information, specify:
   - The file path (e.g., "intelligence/brand-guidelines/01-company-fundamentals.md")
   - The section where it should be added (e.g., "Company Mission", "Key Features", etc.)
   - The exact content to add
   - Your reasoning for this placement

Respond ONLY with a valid JSON array of suggestions. Each suggestion must have these exact fields:
{
  "file": "intelligence/folder/filename.md",
  "section": "Section Name",
  "content": "The content to add",
  "reasoning": "Why this information belongs here"
}

Important:
- Only suggest files that exist in the structure above
- Be specific about sections - use actual section names that would exist in these files
- Keep content concise and well-formatted
- If the braindump contains multiple pieces of information, create multiple suggestions
- Respond with ONLY the JSON array, no other text`;

    // Use Claude CLI to process
    const { spawn } = require('child_process');
    const claudeProcess = spawn('claude', ['--output-format', 'text'], {
      cwd: __dirname,
      env: { ...process.env }
    });

    let output = '';
    let errorOutput = '';

    claudeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    claudeProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    claudeProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Claude CLI error:', errorOutput);
        return res.status(500).json({ error: 'Failed to process braindump' });
      }

      try {
        // Try to parse the entire response as JSON
        let suggestions = JSON.parse(output);
        res.json({ suggestions });
      } catch (e) {
        // If that fails, try to extract JSON from markdown code blocks
        const jsonMatch = output.match(/```json\n([\s\S]*?)\n```/) ||
                         output.match(/```\n([\s\S]*?)\n```/) ||
                         output.match(/\[([\s\S]*)\]/);

        if (jsonMatch) {
          try {
            const suggestions = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            res.json({ suggestions });
          } catch (parseError) {
            console.error('Failed to parse extracted JSON:', parseError);
            res.status(500).json({ error: 'Failed to parse AI response' });
          }
        } else {
          console.error('Failed to parse Claude response:', output);
          res.status(500).json({ error: 'Failed to parse AI response' });
        }
      }
    });

    claudeProcess.on('error', (error) => {
      console.error('Failed to start Claude process:', error);
      res.status(500).json({ error: 'Failed to start Claude CLI' });
    });

    // Send the prompt to Claude
    claudeProcess.stdin.write(prompt + '\n');
    claudeProcess.stdin.end();

  } catch (error) {
    console.error('Error processing braindump:', error);
    res.status(500).json({ error: 'Failed to process braindump' });
  }
});

/**
 * POST /api/braindump/approve
 * Save approved braindump suggestions to intelligence files
 */
app.post('/api/braindump/approve', async (req, res) => {
  try {
    const { suggestions } = req.body;

    if (!suggestions || !Array.isArray(suggestions)) {
      return res.status(400).json({ error: 'suggestions array required' });
    }

    for (const suggestion of suggestions) {
      const { file: filePath, section, content } = suggestion;

      if (!filePath || !filePath.startsWith('intelligence/')) {
        continue;
      }

      const fullPath = path.join(__dirname, filePath);

      // Read existing file content
      let existingContent = '';
      try {
        existingContent = await fs.readFile(fullPath, 'utf-8');
      } catch (error) {
        console.warn(`File not found: ${filePath}, skipping`);
        continue;
      }

      // Append new content with section header
      const timestamp = new Date().toISOString().split('T')[0];
      const newContent = `\n\n## ${section} (Updated ${timestamp})\n\n${content}`;
      const updatedContent = existingContent + newContent;

      // Write back to file
      await fs.writeFile(fullPath, updatedContent, 'utf-8');
    }

    res.json({ success: true, updated: suggestions.length });
  } catch (error) {
    console.error('Error saving braindump:', error);
    res.status(500).json({ error: 'Failed to save braindump' });
  }
});

/**
 * POST /api/intelligence/sync
 * Searches web for latest industry updates and generates intelligence suggestions
 */
app.post('/api/intelligence/sync', async (req, res) => {
  try {
    console.log('Sync intelligence requested - searching for latest updates...');

    // Search topics relevant to Numia's industry
    const searchTopics = [
      'blockchain data infrastructure 2025',
      'web3 analytics tools latest',
      'cosmos ecosystem updates',
      'blockchain RPC providers news',
      'data warehouse blockchain',
    ];

    // Use Claude to search and analyze web content
    const prompt = `You are an intelligence analyst researching the latest developments in blockchain data infrastructure, web3 analytics, and the Cosmos ecosystem.

Search the web for the most recent and relevant updates (within last 30 days) on these topics:
- Blockchain data infrastructure trends
- Web3 analytics and data tools
- Cosmos ecosystem developments
- Competitor announcements (Dune Analytics, The Graph, Flipside, etc.)
- New blockchain data products or services

For each finding, create a structured intelligence update with:
1. The source URL and date
2. Key information extracted
3. Which intelligence file it belongs in
4. Why it's relevant to Numia

Respond with a JSON array of intelligence suggestions in this exact format:
[
  {
    "file": "intelligence/research/competitor-deep-dive.md",
    "section": "Recent Competitor Updates",
    "content": "[Date] [Competitor Name]: [Key development or announcement]\\nSource: [URL]",
    "reasoning": "Why this is relevant to Numia's positioning",
    "source_url": "https://...",
    "source_date": "2025-01-XX"
  }
]

Available intelligence files you can suggest updates for:
- intelligence/research/competitor-deep-dive.md
- intelligence/research/marketing-benchmarks.md
- intelligence/research/events-calendar-2025.md
- intelligence/brand-guidelines/01-company-fundamentals.md

Only include real, fact-checked information from reliable sources. Aim for 5-10 high-quality updates.`;

    const { spawn } = require('child_process');
    const claudeProcess = spawn('claude', ['--output-format', 'text'], {
      cwd: __dirname,
      env: { ...process.env }
    });

    let output = '';
    let errorOutput = '';
    let hasResponded = false;

    // Set timeout for 30 seconds
    const timeout = setTimeout(() => {
      if (!hasResponded) {
        console.log('Intelligence sync timeout - killing Claude process');
        claudeProcess.kill();
        hasResponded = true;
        res.status(408).json({
          error: 'Intelligence sync timed out. Web searches can take a while - try again later or reduce scope.',
          timeout: true
        });
      }
    }, 30000); // 30 second timeout

    claudeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    claudeProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    claudeProcess.on('close', (code) => {
      clearTimeout(timeout);

      if (hasResponded) {
        return; // Already sent timeout response
      }

      hasResponded = true;

      if (code !== 0) {
        console.error('Claude CLI error:', errorOutput);
        return res.status(500).json({ error: 'Failed to gather intelligence updates' });
      }

      try {
        // Try to parse the entire response as JSON
        let suggestions = JSON.parse(output);

        // Validate structure
        if (!Array.isArray(suggestions)) {
          throw new Error('Response is not an array');
        }

        console.log(`Found ${suggestions.length} intelligence updates`);
        res.json({
          suggestions,
          message: `Found ${suggestions.length} intelligence updates from recent industry developments`
        });
      } catch (e) {
        // If that fails, try to extract JSON from markdown code blocks
        const jsonMatch = output.match(/```json\n([\s\S]*?)\n```/) ||
                         output.match(/```\n([\s\S]*?)\n```/) ||
                         output.match(/\[([\s\S]*)\]/);

        if (jsonMatch) {
          try {
            const suggestions = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            console.log(`Found ${suggestions.length} intelligence updates`);
            res.json({
              suggestions,
              message: `Found ${suggestions.length} intelligence updates from recent industry developments`
            });
          } catch (parseError) {
            console.error('Failed to parse extracted JSON:', parseError);
            console.error('Raw output:', output);
            res.status(500).json({ error: 'Failed to parse intelligence updates' });
          }
        } else {
          console.error('Failed to find JSON in Claude response:', output);
          res.status(500).json({ error: 'Failed to parse intelligence updates' });
        }
      }
    });

    claudeProcess.on('error', (error) => {
      clearTimeout(timeout);
      if (!hasResponded) {
        console.error('Failed to start Claude process:', error);
        hasResponded = true;
        res.status(500).json({ error: 'Failed to start intelligence gathering' });
      }
    });

    // Send the prompt to Claude
    claudeProcess.stdin.write(prompt + '\n');
    claudeProcess.stdin.end();

  } catch (error) {
    console.error('Error in sync endpoint:', error);
    res.status(500).json({ error: 'Failed to sync intelligence' });
  }
});

/**
 * POST /api/save-output-intelligence
 * Save generated output to intelligence/outputs folder and extract learnings
 */
app.post('/api/save-output-intelligence', async (req, res) => {
  try {
    const { content, platform, input } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content required' });
    }

    // Create platform-specific output folder
    const outputsDir = path.join(__dirname, 'intelligence', 'outputs', platform);
    await fs.mkdir(outputsDir, { recursive: true });

    // Save the actual output
    const timestamp = new Date().toISOString().split('T')[0];
    const timeString = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    const outputFilename = `${timestamp}-${timeString}.md`;
    const outputPath = path.join(outputsDir, outputFilename);

    await fs.writeFile(outputPath, content, 'utf-8');
    console.log(`Saved output to: intelligence/outputs/${platform}/${outputFilename}`);

    // Extract key learnings using Claude
    const prompt = `Analyze this generated ${platform} content and extract key learnings that can improve future content generation.

Input that was used:
${input}

Generated output:
${content}

Extract:
1. What worked well (tone, structure, hooks)
2. Key messaging patterns
3. Effective phrases or frameworks used
4. Platform-specific insights

Respond with 3-5 concise bullet points of actionable learnings. Be specific and focus on what made this content effective. Format as markdown bullets.`;

    const { spawn } = require('child_process');
    const claudeProcess = spawn('claude', ['--output-format', 'text'], {
      cwd: __dirname,
      env: { ...process.env }
    });

    let learnings = '';
    claudeProcess.stdout.on('data', (data) => {
      learnings += data.toString();
    });

    claudeProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error('Claude error extracting learnings');
        return res.status(500).json({ error: 'Failed to extract learnings' });
      }

      // Create intelligence/output-intelligence folder for learnings
      const outputIntelligenceDir = path.join(__dirname, 'intelligence', 'output-intelligence');
      await fs.mkdir(outputIntelligenceDir, { recursive: true });

      // Create filename with timestamp and platform
      const learningsTimestamp = new Date().toISOString().split('T')[0];
      const filename = `${learningsTimestamp}-${platform}-learnings.md`;
      const filepath = path.join(outputIntelligenceDir, filename);

      // Format content with metadata
      const fullContent = `# ${platform.charAt(0).toUpperCase() + platform.slice(1)} Content Learnings
Generated: ${new Date().toISOString()}

## Input
${input}

## Output Sample
${content.substring(0, 200)}...

## Key Learnings
${learnings}
`;

      await fs.writeFile(filepath, fullContent, 'utf-8');

      res.json({
        success: true,
        outputFile: `intelligence/outputs/${platform}/${outputFilename}`,
        learningsFile: `intelligence/output-intelligence/${filename}`
      });
    });

    claudeProcess.on('error', (error) => {
      console.error('Failed to start Claude process:', error);
      res.status(500).json({ error: 'Failed to extract learnings' });
    });

    claudeProcess.stdin.write(prompt + '\n');
    claudeProcess.stdin.end();

  } catch (error) {
    console.error('Error saving output intelligence:', error);
    res.status(500).json({ error: 'Failed to save output intelligence' });
  }
});

/**
 * POST /api/library/upload-image
 * Upload a base64 image and return a public URL
 */
app.post('/api/library/upload-image', async (req, res) => {
  try {
    const { imageData, title } = req.body;

    if (!imageData || !imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    // Extract base64 data
    const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const [, extension, base64Data] = matches;

    // Generate unique filename
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension === 'jpeg' ? 'jpg' : extension}`;
    const filepath = path.join(__dirname, 'public/library-images', filename);

    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(filepath, buffer);

    // Return public URL
    const publicUrl = `http://localhost:${PORT}/library-images/${filename}`;

    console.log(`[Library] Saved image: ${filename} (${(buffer.length / 1024).toFixed(1)}KB)`);

    res.json({
      success: true,
      url: publicUrl,
      filename
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * DELETE /api/library/image/:filename
 * Delete an image file
 */
app.delete('/api/library/image/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // Security: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = path.join(__dirname, 'public/library-images', filename);

    try {
      await fs.unlink(filepath);
      console.log(`[Library] Deleted image: ${filename}`);
      res.json({ success: true });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'Image not found' });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

/**
 * POST /api/typefully/draft
 * Create a draft in Typefully
 */
app.post('/api/typefully/draft', async (req, res) => {
  try {
    let { content, mediaUrl, platform } = req.body;

    // DEBUG: Log what we received
    console.log('[Typefully] Request received:');
    console.log('  content:', content ? `"${content.substring(0, 50)}..."` : content);
    console.log('  mediaUrl:', mediaUrl);
    console.log('  platform:', platform);

    // Check for Typefully API key
    const typefullyApiKey = process.env.TYPEFULLY_API_KEY;
    if (!typefullyApiKey) {
      return res.status(500).json({
        error: 'Typefully API key not configured. Add TYPEFULLY_API_KEY to your .env file.'
      });
    }

    // Variable to store media_id from Typefully
    let typefullyMediaId = null;

    // If mediaUrl is a localhost URL, upload to Typefully to get media_id
    if (mediaUrl && mediaUrl.startsWith('http://localhost')) {
      try {
        console.log('[Typefully] Localhost image detected, uploading to Typefully...');

        // Read the image file from disk
        const filename = mediaUrl.split('/').pop();

        // Security: validate filename
        if (!filename || filename.includes('..') || filename.includes('/')) {
          throw new Error('Invalid filename in mediaUrl');
        }

        const imagePath = path.join(__dirname, 'public/library-images', filename);

        // Verify file exists before reading
        try {
          await fs.access(imagePath);
        } catch (accessError) {
          throw new Error(`Image file not found: ${filename}`);
        }

        const imageBuffer = await fs.readFile(imagePath);

        // Validate file size (max 10MB for social media)
        const maxSizeBytes = 10 * 1024 * 1024; // 10MB
        if (imageBuffer.length > maxSizeBytes) {
          throw new Error(`Image too large: ${(imageBuffer.length / 1024 / 1024).toFixed(1)}MB. Maximum is 10MB.`);
        }

        console.log('[Typefully] Image:', filename, 'Size:', (imageBuffer.length / 1024).toFixed(1), 'KB');

        // First, get social set ID
        const setsResponse = await fetch('https://api.typefully.com/v2/social-sets', {
          headers: { 'Authorization': `Bearer ${typefullyApiKey}` },
        });

        if (!setsResponse.ok) throw new Error('Failed to get social sets');

        const sets = await setsResponse.json();
        const socialSetId = sets.results?.[0]?.id || sets.data?.[0]?.id || sets[0]?.id;
        if (!socialSetId) throw new Error('No social set found');

        console.log('[Typefully] Using social set:', socialSetId);

        // Step 1: Request upload URL from Typefully
        const uploadInitResp = await fetch(`https://api.typefully.com/v2/social-sets/${socialSetId}/media/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${typefullyApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file_name: filename }),
        });

        if (!uploadInitResp.ok) {
          const err = await uploadInitResp.text();
          throw new Error(`Upload init failed: ${err}`);
        }

        const { media_id, upload_url } = await uploadInitResp.json();
        console.log('[Typefully] Got media_id:', media_id);

        // Step 2: Upload to S3 with retry logic
        let s3UploadSuccess = false;
        let s3Attempts = 0;
        const maxS3Attempts = 3;

        while (!s3UploadSuccess && s3Attempts < maxS3Attempts) {
          s3Attempts++;
          console.log(`[Typefully] S3 upload attempt ${s3Attempts}/${maxS3Attempts}...`);

          try {
            const s3Resp = await fetch(upload_url, {
              method: 'PUT',
              body: imageBuffer,
            });

            console.log('[Typefully] S3 upload status:', s3Resp.status);

            if (s3Resp.ok) {
              s3UploadSuccess = true;
              console.log('[Typefully] Upload successful! Waiting for processing...');
            } else {
              const s3Error = await s3Resp.text();
              console.error('[Typefully] S3 error response:', s3Error);

              if (s3Attempts < maxS3Attempts) {
                console.log('[Typefully] Retrying S3 upload in 2 seconds...');
                await new Promise(resolve => setTimeout(resolve, 2000));
              } else {
                throw new Error(`S3 upload failed after ${maxS3Attempts} attempts: ${s3Resp.status}`);
              }
            }
          } catch (uploadError) {
            if (s3Attempts < maxS3Attempts) {
              console.error('[Typefully] S3 upload error:', uploadError.message);
              console.log('[Typefully] Retrying S3 upload in 2 seconds...');
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              throw new Error(`S3 upload failed after ${maxS3Attempts} attempts: ${uploadError.message}`);
            }
          }
        }

        // Step 3: Wait for media to be processed (poll status with retries)
        let mediaReady = false;
        let attempts = 0;
        const maxAttempts = 20; // Increased from 10 to 20 for larger images
        const pollInterval = 1000; // 1 second between checks

        while (!mediaReady && attempts < maxAttempts) {
          attempts++;
          console.log(`[Typefully] Checking media status (attempt ${attempts}/${maxAttempts})...`);

          try {
            const statusResp = await fetch(`https://api.typefully.com/v2/social-sets/${socialSetId}/media/${media_id}`, {
              headers: { 'Authorization': `Bearer ${typefullyApiKey}` },
              timeout: 5000 // 5 second timeout for status check
            });

            if (statusResp.ok) {
              const statusData = await statusResp.json();
              console.log('[Typefully] Media status:', statusData.status);

              if (statusData.status === 'ready') {
                mediaReady = true;
                console.log('[Typefully] Media is ready!');
              } else if (statusData.status === 'failed') {
                throw new Error(`Media processing failed. Typefully error: ${JSON.stringify(statusData)}`);
              } else if (statusData.status === 'processing') {
                // Still processing, wait before next check
                await new Promise(resolve => setTimeout(resolve, pollInterval));
              } else {
                // Unknown status
                console.warn('[Typefully] Unknown media status:', statusData.status);
                await new Promise(resolve => setTimeout(resolve, pollInterval));
              }
            } else {
              console.error('[Typefully] Status check failed:', statusResp.status);
              // Retry on status check failure
              await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
          } catch (statusError) {
            console.error('[Typefully] Status check error:', statusError.message);
            // Continue polling even if one check fails
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
        }

        if (!mediaReady) {
          throw new Error(`Media processing timeout after ${maxAttempts} attempts. The image may be too large or Typefully is experiencing issues.`);
        }

        typefullyMediaId = media_id;
        mediaUrl = null; // Clear since we're using media_id

      } catch (uploadError) {
        console.error('[Typefully] Upload failed:', uploadError.message);
        mediaUrl = null;
        typefullyMediaId = null;
      }
    }

    // Check if we have any content to send
    if (!content && !mediaUrl && !typefullyMediaId) {
      return res.status(400).json({
        error: 'Cannot create empty draft. Please provide either content text or an image.',
      });
    }

    // Determine which platform to use (default to Twitter if not specified)
    const platformKey = platform === 'linkedin' ? 'linkedin' : 'x';
    console.log(`Creating ${platformKey} draft in Typefully`);
    console.log(`Content: "${content || ''}", Media ID: ${typefullyMediaId || 'none'}`);

    // First, get the social sets to find the default one
    const setsResponse = await fetch('https://api.typefully.com/v2/social-sets', {
      headers: {
        'Authorization': `Bearer ${typefullyApiKey}`,
      },
    });

    if (!setsResponse.ok) {
      const errorText = await setsResponse.text();
      console.error('Typefully API error:', errorText);
      return res.status(setsResponse.status).json({
        error: `Failed to get social sets: ${setsResponse.statusText}`,
        details: errorText
      });
    }

    const sets = await setsResponse.json();
    console.log('Typefully social sets response:', JSON.stringify(sets, null, 2));

    // Handle different response structures
    let socialSetId;
    if (Array.isArray(sets) && sets.length > 0) {
      socialSetId = sets[0].id;
    } else if (sets.data && Array.isArray(sets.data) && sets.data.length > 0) {
      socialSetId = sets.data[0].id;
    } else if (sets.results && Array.isArray(sets.results) && sets.results.length > 0) {
      socialSetId = sets.results[0].id;
    } else {
      console.error('Unexpected social sets response structure:', sets);
      return res.status(400).json({
        error: 'Could not find social sets in your Typefully account. Response: ' + JSON.stringify(sets)
      });
    }

    // Build the draft payload for Typefully API v2
    const draftPayload = {
      platforms: {
        [platformKey]: {
          enabled: true,
          posts: [
            {
              text: content || '',
            }
          ]
        }
      }
    };

    // Add media if provided
    if (typefullyMediaId) {
      draftPayload.platforms[platformKey].posts[0].media_ids = [typefullyMediaId];
      console.log('[Typefully] Using media_ids:', [typefullyMediaId]);
    }

    console.log('Creating draft with payload:', JSON.stringify(draftPayload, null, 2));

    // Create the draft
    const response = await fetch(`https://api.typefully.com/v2/social-sets/${socialSetId}/drafts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${typefullyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Typefully API error:', errorText);
      return res.status(response.status).json({
        error: `Typefully API error: ${response.statusText}`,
        details: errorText
      });
    }

    const result = await response.json();
    console.log('Draft created in Typefully:', result);

    res.json({
      success: true,
      draft: result,
      private_url: result.private_url,
      message: `Draft created successfully in Typefully for ${platformKey === 'x' ? 'Twitter' : 'LinkedIn'}`
    });

  } catch (error) {
    console.error('Error creating Typefully draft:', error);
    res.status(500).json({
      error: 'Failed to create draft',
      message: error.message
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'local',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Local Content API Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ Running on http://localhost:${PORT}`);
  console.log(`✓ Serving from: ${CONTENT_INDEX}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET    /health                       - Health check`);
  console.log(`  GET    /api/changelog                - Git commit history`);
  console.log(`  GET    /api/content                  - List all content`);
  console.log(`  GET    /api/content/:id              - Get specific content`);
  console.log(`  GET    /api/intelligence             - Intelligence directory structure`);
  console.log(`  GET    /api/intelligence/file        - Get intelligence file content`);
  console.log(`  PUT    /api/intelligence/file        - Save intelligence file changes`);
  console.log(`  POST   /api/intelligence/sync        - Sync intelligence with latest updates`);
  console.log(`  POST   /api/save-output-intelligence - Save output learnings to intelligence`);
  console.log(`  POST   /api/braindump                - Process braindump with AI`);
  console.log(`  POST   /api/braindump/approve        - Save braindump suggestions`);
  console.log(`  POST   /api/generate-content         - Generate content with AI`);
  console.log(`  POST   /api/typefully/draft          - Create draft in Typefully`);
  console.log(`  DELETE /api/content/:id              - Delete content`);
  console.log(`  DELETE /api/content                  - Bulk delete`);
  console.log('');
  console.log('Press CTRL+C to stop');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

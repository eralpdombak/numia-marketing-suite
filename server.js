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
 * POST /api/generate-content
 * Generates content using local slash commands
 */
app.post('/api/generate-content', async (req, res) => {
  try {
    const { prompt, platform } = req.body;

    if (!prompt || !platform) {
      return res.status(400).json({ error: 'prompt and platform required' });
    }

    // Map platform to slash command and intelligence files
    const platformConfig = {
      'linkedin': {
        command: '/linkedin',
        guidelines: 'intelligence/post-guidelines/linkedin-guidelines.md'
      },
      'twitter': {
        command: '/twitter',
        guidelines: 'intelligence/post-guidelines/twitter-guidelines.md'
      },
      'blog': {
        command: '/blog',
        guidelines: 'intelligence/post-guidelines/blog-guidelines.md'
      },
      'email': {
        command: '/email',
        guidelines: null
      },
      'newsletter': {
        command: '/newsletter',
        guidelines: 'intelligence/post-guidelines/newsletter-guidelines.md'
      }
    };

    const config = platformConfig[platform];
    if (!config) {
      return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }

    // Load intelligence guidelines if they exist
    let guidelinesContent = '';
    if (config.guidelines) {
      try {
        const guidelinesPath = path.join(__dirname, config.guidelines);
        guidelinesContent = await fs.readFile(guidelinesPath, 'utf-8');
      } catch (error) {
        console.warn(`Could not load guidelines for ${platform}:`, error.message);
      }
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

    // Send the slash command + guidelines context + prompt
    let fullPrompt = config.command;
    if (guidelinesContent) {
      fullPrompt += `\n\nGuidelines to follow:\n${guidelinesContent}\n\nUser prompt:`;
    }
    fullPrompt += ` ${prompt}\n`;

    claudeProcess.stdin.write(fullPrompt);
    claudeProcess.stdin.end();

    // Buffer for accumulating output
    let buffer = '';
    let hasStartedSending = false;

    // Patterns that indicate meta-commentary (case-insensitive)
    const metaCommentaryPatterns = [
      /^I see the permission issue\./i,
      /^I need your permission/i,
      /^In the meantime/i,
      /^Let me show you/i,
      /^Here's (a|an|the|your)/i,
      /^I've created/i,
      /^I'll create/i,
      /^Based on your/i,
      /^Would you like me to/i,
      /^Should I/i,
      /^POST \d+\/\d+:/i,
      /^THREAD \d+\/\d+:/i,
      /^Tweet \d+:/i,
      /^LinkedIn Post:/i,
      /^Twitter Thread:/i,
      /^Blog Post:/i,
      /^---+\s*$/,
      /^\*\*LinkedIn Post:/i,
      /^\*\*Twitter Thread:/i,
      /^\*\*Blog Post:/i,
      /^✅/,  // Checklist items
      /^❌/,  // Checklist items
      /^\*\*Hook \(/i,  // **Hook (77 chars):**
      /^\*\*Ultra-specific/i,
      /^\*\*Tons of white/i,
      /^\*\*No AI-speak/i,
      /^\*\*Validation/i,
      /^\*\*Engagement/i,
      /^\*\*Tangible/i,
      /^\*\*Emotional/i,
      /^\*\*No hashtags/i,
      /^\*\*Respectful/i,
      /^The post is ready to be saved/i,
      /^once you approve/i,
      /^file write permission/i,
    ];

    const shouldSkipLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      return metaCommentaryPatterns.some(pattern => pattern.test(trimmed));
    };

    let hasEncounteredPostCommentary = false;

    claudeProcess.stdout.on('data', (data) => {
      const text = data.toString();
      buffer += text;

      // Process line by line to filter out meta-commentary
      const lines = buffer.split('\n');

      // Keep the last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        // If we've already hit post-content commentary, stop sending everything
        if (hasEncounteredPostCommentary) {
          continue;
        }

        // Check if this line is meta-commentary
        const isMetaCommentary = shouldSkipLine(line);

        if (isMetaCommentary) {
          // If we've already started sending content, this is POST-content meta-commentary
          // Stop sending from here on out
          if (hasStartedSending) {
            console.log('Hit post-content commentary, stopping output:', line.substring(0, 50));
            hasEncounteredPostCommentary = true;
            continue;
          }
          // Otherwise it's pre-content meta-commentary, just skip it
          console.log('Filtered out pre-content meta-commentary:', line.substring(0, 50));
          continue;
        }

        // Only start sending after we've skipped initial meta-commentary
        if (!hasStartedSending && line.trim()) {
          console.log('Starting content output at:', line.substring(0, 50));
          hasStartedSending = true;
        }

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
      // Send any remaining buffered content
      if (buffer.trim() && hasStartedSending && !shouldSkipLine(buffer)) {
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

    // Check for Typefully API key
    const typefullyApiKey = process.env.TYPEFULLY_API_KEY;
    if (!typefullyApiKey) {
      return res.status(500).json({
        error: 'Typefully API key not configured. Add TYPEFULLY_API_KEY to your .env file.'
      });
    }

    // If mediaUrl is a localhost URL, upload to imgbb to get a public URL
    if (mediaUrl && mediaUrl.startsWith('http://localhost')) {
      try {
        console.log('[Typefully] Localhost image detected, uploading to imgbb...');

        // Read the image file from disk
        const filename = mediaUrl.split('/').pop();
        const imagePath = path.join(__dirname, 'public/library-images', filename);
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // Upload to imgbb (free anonymous upload)
        const FormData = require('form-data');
        const form = new FormData();
        form.append('image', base64Image);

        const uploadResponse = await fetch('https://api.imgbb.com/1/upload?key=d841c8274df032afb3d901f0c21e02e0', {
          method: 'POST',
          body: form,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          mediaUrl = uploadData.data.url;
          console.log('[Typefully] Image uploaded to imgbb:', mediaUrl);
        } else {
          console.error('[Typefully] imgbb upload failed, proceeding without image');
          mediaUrl = null;
        }
      } catch (uploadError) {
        console.error('[Typefully] Failed to upload image:', uploadError);
        mediaUrl = null;
      }
    }

    // Determine which platform to use (default to Twitter if not specified)
    const platformKey = platform === 'linkedin' ? 'linkedin' : 'x';
    console.log(`Creating ${platformKey} draft in Typefully`);

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

    // Add media if provided (only for valid public URLs)
    if (mediaUrl && !mediaUrl.startsWith('data:')) {
      draftPayload.platforms[platformKey].posts[0].media_urls = [mediaUrl];
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

/**
 * Local Content API Server
 * Serves content from content_index.json to React frontend
 * Runs on http://localhost:3001
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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
  console.log(`  GET    /health            - Health check`);
  console.log(`  GET    /api/changelog     - Git commit history`);
  console.log(`  GET    /api/content       - List all content`);
  console.log(`  GET    /api/content/:id   - Get specific content`);
  console.log(`  DELETE /api/content/:id   - Delete content`);
  console.log(`  DELETE /api/content       - Bulk delete`);
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

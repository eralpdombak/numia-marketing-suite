/**
 * Local API Client
 * Connects to local Node.js server instead of Supabase
 * Used when VITE_LOCAL_MODE=true
 */

const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3001';

export interface LocalLibraryItem {
  id: string;
  type: 'text' | 'image';
  content: string;
  platform: string | null;
  created_at: string;
  title: string | null;
  summary?: {
    main_topic: string;
    key_points: string[];
    tone: string;
    hook: string;
    use_case: string;
  };
}

/**
 * Local API Client
 * Mirrors Supabase API for drop-in replacement
 */
export const localApi = {
  /**
   * Get all content items
   */
  async getAll(): Promise<LocalLibraryItem[]> {
    try {
      const response = await fetch(`${LOCAL_API_URL}/api/content`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Failed to fetch content from local API:', error);
      throw error;
    }
  },

  /**
   * Get specific content item by ID
   * Loads full content (not just preview)
   */
  async getOne(id: string): Promise<LocalLibraryItem> {
    try {
      const response = await fetch(`${LOCAL_API_URL}/api/content/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error(`Failed to fetch content ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete content item
   * Removes file from disk and index
   */
  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${LOCAL_API_URL}/api/content/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Failed to delete content ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bulk delete content items
   */
  async bulkDelete(ids: string[]): Promise<void> {
    try {
      const response = await fetch(`${LOCAL_API_URL}/api/content`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to bulk delete content:', error);
      throw error;
    }
  },

  /**
   * Health check
   * Verifies local API server is running
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${LOCAL_API_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Local API health check failed:', error);
      return false;
    }
  }
};

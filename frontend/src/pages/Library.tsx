import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { localApi } from "@/lib/localApi";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const LIBRARY_STORAGE_KEY = "numia-shots-library";
const IS_LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';
const AUTO_REFRESH_INTERVAL = 5000; // 5 seconds

interface LocalLibraryItem {
  id: string;
  src: string;
  createdAt: number;
  title?: string;
}

interface DbLibraryItem {
  id: string;
  type: "text" | "image";
  content: string;
  platform: string | null;
  created_at: string;
  title: string | null;
  // Note: summary and other metadata are intentionally excluded
  // Only public-facing content should be displayed
}

type TabType = "text" | "image";
type SortOption = "newest" | "oldest";

// Industrial icons
function FileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M4 6h16" />
      <path d="M10 6V4h4v2" />
      <path d="M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6" />
      <line x1="10" y1="10" x2="10" y2="16" />
      <line x1="14" y1="10" x2="14" y2="16" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  );
}

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="9" y="9" width="13" height="13" rx="1" />
      <path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="8" y1="11" x2="8" y2="16" />
      <line x1="8" y1="8" x2="8" y2="8.01" strokeWidth="2" />
      <path d="M12 16v-5" />
      <path d="M16 16v-3a2 2 0 00-4 0" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M4 4l11.733 16h4.267l-11.733-16z" />
      <path d="M4 20l6.4-8" />
      <path d="M20 4l-6.4 8" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="4" width="18" height="4" />
      <path d="M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn(className, "animate-spin")}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function SortIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M3 6h18" />
      <path d="M6 12h12" />
      <path d="M9 18h6" />
    </svg>
  );
}

function CheckboxIcon({ className, checked }: { className?: string; checked?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" fill={checked ? "currentColor" : "none"} />
      {checked && <path d="M9 12l2 2 4-4" stroke={checked ? "#18181b" : "currentColor"} strokeWidth="2" />}
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function ExportIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ComposeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M12 5v14M5 12h14" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

const platformIcons: Record<string, React.FC<{ className?: string }>> = {
  linkedin: LinkedInIcon,
  twitter: TwitterIcon,
  blog: FileIcon,
  newsletter: MailIcon,
};

// Clean LinkedIn content by removing AI-generated options text
function cleanLinkedInContent(content: string, platform: string | null): string {
  if (platform !== 'linkedin') return content;

  // Remove "Here's a few options..." or similar introductory text
  let cleaned = content.replace(/^(?:here'?s?|here are)\s+(?:\d+\s+)?(?:a few\s+)?options?[^\n]*\n*/i, '');

  // Remove "Option X:" or "Option X." prefixes at the start or after newlines
  cleaned = cleaned.replace(/(?:^|\n+)option\s+\d+[:.]\s*/gi, '');

  // Remove extra leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

export default function Library() {
  const [activeTab, setActiveTab] = useState<TabType>("text");
  const [textItems, setTextItems] = useState<DbLibraryItem[]>([]);
  const [imageItems, setImageItems] = useState<LocalLibraryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<LocalLibraryItem | null>(null);
  const [selectedText, setSelectedText] = useState<DbLibraryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // UX enhancements
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOption>("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);

  // Compose modal state
  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState<DbLibraryItem | null>(null);
  const [composeImage, setComposeImage] = useState<LocalLibraryItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [composeStep, setComposeStep] = useState<'text' | 'image'>('text');
  const [composeTextSearch, setComposeTextSearch] = useState('');
  const [composeImageSearch, setComposeImageSearch] = useState('');

  useEffect(() => {
    loadLibraryItems();
  }, []);

  // Auto-refresh in local mode (poll every 5 seconds)
  useEffect(() => {
    if (!IS_LOCAL_MODE) return; // Only in local mode

    const interval = setInterval(() => {
      loadLibraryItems();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Listen for localStorage changes (when images are saved from Shots)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LIBRARY_STORAGE_KEY) {
        console.log('[Library] Storage changed, reloading images');
        const saved = localStorage.getItem(LIBRARY_STORAGE_KEY);
        if (saved) {
          setImageItems(JSON.parse(saved));
        }
      }
    };

    // Also use custom event for same-window storage updates
    const handleCustomStorage = () => {
      console.log('[Library] Custom storage event, reloading images');
      const saved = localStorage.getItem(LIBRARY_STORAGE_KEY);
      if (saved) {
        setImageItems(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdate', handleCustomStorage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleCustomStorage);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to exit selection mode or close dialogs
      if (e.key === "Escape") {
        if (selectedImage || selectedText) return; // Let dialog handle it
        if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedIds(new Set());
        }
      }
      // Ctrl/Cmd + A to select all
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && isSelectionMode) {
        e.preventDefault();
        const items = activeTab === "text" ? filteredTextItems : filteredImageItems;
        setSelectedIds(new Set(items.map(i => i.id)));
      }
      // Delete key to delete selected
      if (e.key === "Delete" && isSelectionMode && selectedIds.size > 0) {
        handleBulkDelete();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelectionMode, selectedIds, activeTab, selectedImage, selectedText]);

  const loadLibraryItems = async () => {
    setLoading(true);
    try {
      // Load images from localStorage FIRST (works in both modes)
      const saved = localStorage.getItem(LIBRARY_STORAGE_KEY);
      console.log('[Library] Raw localStorage data:', saved);

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('[Library] Parsed images count:', Array.isArray(parsed) ? parsed.length : 0);
          console.log('[Library] Parsed images:', parsed);
          setImageItems(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.error('[Library] Failed to parse images:', e);
          setImageItems([]);
        }
      } else {
        console.log('[Library] No localStorage data found for key:', LIBRARY_STORAGE_KEY);
        setImageItems([]);
      }

      if (IS_LOCAL_MODE) {
        // Load from local API server
        const apiData = await localApi.getAll();
        console.log('[Library] Loaded from local API:', apiData.length, 'items');

        // Also load from localStorage (for items saved from Notes page)
        const localStorageItems = JSON.parse(localStorage.getItem('library_items') || '[]');
        console.log('[Library] Loaded from localStorage:', localStorageItems.length, 'items');

        // Merge both sources
        const allTextItems = [
          ...localStorageItems.filter((item: DbLibraryItem) => item.type === "text"),
          ...apiData.filter(item => item.type === "text")
        ];

        setTextItems(allTextItems as DbLibraryItem[]);
      } else {
        // Load from Supabase (cloud mode)
        console.log('[Library] Loading from Supabase...');
        const { data, error } = await supabase
          .from("library_items")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error('[Library] Supabase error:', error);
          throw error;
        }

        console.log('[Library] Supabase returned:', data?.length || 0, 'items');
        console.log('[Library] Supabase data:', data);

        const textItems = (data as DbLibraryItem[]).filter(item => item.type === "text");
        console.log('[Library] Filtered text items:', textItems.length);
        setTextItems(textItems);

        const saved = localStorage.getItem(LIBRARY_STORAGE_KEY);
        if (saved) {
          setImageItems(JSON.parse(saved));
        }
      }
    } catch (e) {
      console.error("Failed to load library:", e);
      toast.error("Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted items
  const filteredTextItems = useMemo(() => {
    let items = textItems;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.content.toLowerCase().includes(query) ||
        (item.platform && item.platform.toLowerCase().includes(query)) ||
        (item.title && item.title.toLowerCase().includes(query))
      );
    }
    
    // Platform filter
    if (platformFilter) {
      items = items.filter(item => item.platform === platformFilter);
    }
    
    // Sort
    items = [...items].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    
    return items;
  }, [textItems, searchQuery, sortOrder, platformFilter]);

  const filteredImageItems = useMemo(() => {
    let items = [...imageItems];
    
    // Search filter for images by title
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.title && item.title.toLowerCase().includes(query)
      );
    }
    
    // Sort
    items = items.sort((a, b) => {
      return sortOrder === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
    });
    
    return items;
  }, [imageItems, sortOrder, searchQuery]);

  // Get unique platforms for filter
  const availablePlatforms = useMemo(() => {
    const platforms = new Set(textItems.map(i => i.platform).filter(Boolean));
    return Array.from(platforms) as string[];
  }, [textItems]);

  const handleDeleteText = async (id: string) => {
    setDeleting(id);
    try {
      console.log('[Library] Deleting text item:', id, 'Local mode:', IS_LOCAL_MODE);
      if (IS_LOCAL_MODE) {
        // Try deleting from local API first
        try {
          await localApi.delete(id);
          console.log('[Library] Deleted from backend successfully');
        } catch (apiError) {
          // If API delete fails, item might be in localStorage only
          console.log('[Library] API delete failed, trying localStorage');
          const localItems = JSON.parse(localStorage.getItem('library_items') || '[]');
          const updated = localItems.filter((item: DbLibraryItem) => item.id !== id);
          localStorage.setItem('library_items', JSON.stringify(updated));
        }
      } else {
        const { error } = await supabase.from("library_items").delete().eq("id", id);
        if (error) throw error;
      }
      setTextItems(prev => prev.filter(item => item.id !== id));
      toast.success("Removed from library");
      if (selectedText?.id === id) {
        setSelectedText(null);
      }
    } catch (error) {
      console.error("[Library] Error deleting text item:", error);
      toast.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const item = imageItems.find(i => i.id === id);
      if (!item) return;

      // Delete from server if it has a filename (new URL-based images)
      if ('filename' in item && item.filename) {
        const API_URL = import.meta.env.VITE_LOCAL_MODE === 'true'
          ? 'http://localhost:3001'
          : '';

        try {
          await fetch(`${API_URL}/api/library/image/${item.filename}`, {
            method: 'DELETE',
          });
          console.log('[Library] Deleted image file from server:', item.filename);
        } catch (error) {
          console.error('[Library] Failed to delete from server:', error);
          // Continue anyway to remove from localStorage
        }
      }

      // Remove from localStorage
      const updated = imageItems.filter(item => item.id !== id);
      setImageItems(updated);
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated));
      toast.success("Removed from library");
      if (selectedImage?.id === id) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('[Library] Delete error:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    const idsArray = Array.from(selectedIds);

    if (activeTab === "text") {
      try {
        console.log('[Library] Bulk deleting:', count, 'items, Local mode:', IS_LOCAL_MODE);
        if (IS_LOCAL_MODE) {
          try {
            await localApi.bulkDelete(idsArray);
            console.log('[Library] Bulk deleted from backend successfully');
          } catch (apiError) {
            console.log('[Library] API bulk delete failed, trying localStorage');
          }
          // Also clean up localStorage
          const localItems = JSON.parse(localStorage.getItem('library_items') || '[]');
          const updated = localItems.filter((item: DbLibraryItem) => !selectedIds.has(item.id));
          localStorage.setItem('library_items', JSON.stringify(updated));
        } else {
          const { error } = await supabase
            .from("library_items")
            .delete()
            .in("id", idsArray);
          if (error) throw error;
        }
        setTextItems(prev => prev.filter(item => !selectedIds.has(item.id)));
        toast.success(`Deleted ${count} items`);
      } catch (error) {
        console.error("[Library] Bulk delete error:", error);
        toast.error(`Failed to delete items: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Bulk delete images
      const imagesToDelete = imageItems.filter(item => selectedIds.has(item.id));
      const API_URL = import.meta.env.VITE_LOCAL_MODE === 'true'
        ? 'http://localhost:3001'
        : '';

      // Delete files from server for new URL-based images
      for (const item of imagesToDelete) {
        if ('filename' in item && item.filename) {
          try {
            await fetch(`${API_URL}/api/library/image/${item.filename}`, {
              method: 'DELETE',
            });
            console.log('[Library] Deleted image file from server:', item.filename);
          } catch (error) {
            console.error('[Library] Failed to delete from server:', error);
            // Continue with other deletions
          }
        }
      }

      const updated = imageItems.filter(item => !selectedIds.has(item.id));
      setImageItems(updated);
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated));
      toast.success(`Deleted ${count} items`);
    }

    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleDownload = (item: LocalLibraryItem) => {
    const link = document.createElement('a');
    // Library items are JPEG, so use .jpg extension
    const filename = item.title ? `${item.title.replace(/[^a-zA-Z0-9-_]/g, '-')}.jpg` : `mockup-${item.id}.jpg`;
    link.download = filename;
    link.href = item.src;
    link.click();
    toast.success("Downloaded");
  };

  const handleViewFull = async (item: DbLibraryItem) => {
    try {
      let fullItem: DbLibraryItem;

      if (IS_LOCAL_MODE) {
        // Try fetching from local API first
        try {
          fullItem = await localApi.getOne(item.id);
        } catch (apiError) {
          // If API fails, item might be in localStorage only
          console.log('[Library] API fetch failed, trying localStorage');
          const localItems = JSON.parse(localStorage.getItem('library_items') || '[]');
          const localItem = localItems.find((i: DbLibraryItem) => i.id === item.id);
          if (!localItem) throw new Error('Item not found');
          fullItem = localItem;
        }
      } else {
        // Fetch full content from Supabase
        const { data, error } = await supabase
          .from("library_items")
          .select("*")
          .eq("id", item.id)
          .single();

        if (error) throw error;
        fullItem = data as DbLibraryItem;
      }

      // Filter out secret metadata - only keep public-facing fields
      const publicItem: DbLibraryItem = {
        id: fullItem.id,
        type: fullItem.type,
        content: fullItem.content,
        platform: fullItem.platform,
        created_at: fullItem.created_at,
        title: fullItem.title,
        // Explicitly exclude: summary, prompts, or any other internal metadata
      };

      setSelectedText(publicItem);
    } catch (error) {
      console.error("Failed to load full content:", error);
      toast.error("Failed to load content");
    }
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = async (item: DbLibraryItem | LocalLibraryItem) => {
    try {
      const API_URL = import.meta.env.VITE_LOCAL_MODE === 'true'
        ? 'http://localhost:3001'
        : '';

      let content = '';
      let mediaUrl: string | undefined;
      let platform: string | undefined;

      // Check if it's a text item or image item
      if ('content' in item) {
        // Text item
        content = cleanLinkedInContent(item.content, item.platform);
        platform = item.platform || undefined;
      } else {
        // Image item - just send the image
        mediaUrl = item.src;
      }

      const response = await fetch(`${API_URL}/api/typefully/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          mediaUrl,
          platform,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create draft');
      }

      const result = await response.json();
      toast.success(result.message || "Draft created in Typefully!");
      console.log("[Library] Draft created:", result);
    } catch (error) {
      console.error("[Library] Export error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to export to Typefully");
    }
  };

  const handleComposeExport = async () => {
    if (!composeText && !composeImage) {
      toast.error("Please select at least a text or image");
      return;
    }

    setIsExporting(true);
    try {
      const API_URL = import.meta.env.VITE_LOCAL_MODE === 'true'
        ? 'http://localhost:3001'
        : '';

      const content = composeText ? cleanLinkedInContent(composeText.content, composeText.platform) : '';
      const mediaUrl = composeImage ? composeImage.src : undefined;
      const platform = composeText?.platform || undefined;

      const response = await fetch(`${API_URL}/api/typefully/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          mediaUrl,
          platform,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create draft');
      }

      const result = await response.json();
      toast.success(result.message || "Draft created in Typefully!");
      console.log("[Library] Composed draft created:", result);

      // Close modal and reset
      setShowCompose(false);
      setComposeText(null);
      setComposeImage(null);
    } catch (error) {
      console.error("[Library] Compose export error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to export to Typefully");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const getPlatformLabel = (platform: string | null) => {
    if (!platform) return null;
    const labels: Record<string, string> = {
      linkedin: "LinkedIn",
      twitter: "Twitter/X",
      blog: "Blog Post",
      newsletter: "Newsletter",
    };
    return labels[platform] || platform;
  };

  const currentItems = activeTab === "text" ? filteredTextItems : filteredImageItems;
  const totalItems = activeTab === "text" ? textItems.length : imageItems.length;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="pt-14">
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          {/* Header - Top Bar */}
          <div className="mb-8">
            {/* Search Bar */}
            {(textItems.length > 0 || imageItems.length > 0) && (
              <div className="mb-6">
                <div className="relative w-96">
                  <SearchIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full bg-transparent border-b border-zinc-800 text-zinc-300 placeholder:text-zinc-700 font-mono text-sm pl-6 pr-8 py-2 focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-zinc-500 transition-colors"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tabs and Stats */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <div className="flex gap-8">
                <button
                  onClick={() => {
                    setActiveTab("text");
                    setSelectedIds(new Set());
                    setSearchQuery("");
                    setPlatformFilter(null);
                  }}
                  className={cn(
                    "font-mono text-xs uppercase tracking-wider transition-all duration-100",
                    activeTab === "text"
                      ? "text-zinc-200"
                      : "text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  Posts {textItems.length > 0 && `(${textItems.length})`}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("image");
                    setSelectedIds(new Set());
                    setSearchQuery("");
                    loadLibraryItems();
                  }}
                  className={cn(
                    "font-mono text-xs uppercase tracking-wider transition-all duration-100",
                    activeTab === "image"
                      ? "text-zinc-200"
                      : "text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  Images {imageItems.length > 0 && `(${imageItems.length})`}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCompose(true)}
                  disabled={textItems.length === 0 && imageItems.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 font-mono text-[10px] uppercase tracking-wider transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ComposeIcon className="w-3.5 h-3.5" />
                  Compose
                </button>
                <div className="h-3 w-px bg-zinc-800" />
                <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
                  {currentItems.length} items
                </span>
                <div className="h-3 w-px bg-zinc-800" />
                <button
                  onClick={loadLibraryItems}
                  className="font-mono text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-wider transition-colors"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <LoaderIcon className="w-6 h-6 text-zinc-600" />
              <span className="mt-4 font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Loading</span>
            </div>
          ) : activeTab === "text" ? (
            filteredTextItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
                <div className="w-16 h-16 border border-zinc-800 flex items-center justify-center mb-6">
                  <FileIcon className="w-8 h-8 text-zinc-700" />
                </div>
                <p className="font-mono text-sm text-zinc-500 uppercase tracking-wider">
                  {searchQuery || platformFilter ? "No matching content" : "No saved content"}
                </p>
                <p className="font-mono text-[11px] text-zinc-700 mt-2">
                  {searchQuery || platformFilter ? "Try adjusting your filters" : "Use \"Save to Library\" in the Agent"}
                </p>
                {(searchQuery || platformFilter) && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setPlatformFilter(null);
                    }}
                    className="mt-4 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-[10px] uppercase tracking-wider transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredTextItems.map((item, index) => {
                  const PlatformIcon = item.platform ? platformIcons[item.platform] : FileIcon;
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="group transition-all duration-100"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="p-8 border border-zinc-900 hover:border-zinc-800 transition-all duration-100 cursor-pointer" onClick={() => handleViewFull(item)}>
                        <div className="flex items-center gap-2 mb-4">
                          <PlatformIcon className="w-4 h-4 text-zinc-600" />
                          <span className="text-xs text-zinc-600 uppercase tracking-wider font-mono">
                            {getPlatformLabel(item.platform)}
                          </span>
                        </div>

                        <p className="text-base text-zinc-300 line-clamp-5 mb-6 leading-relaxed group-hover:text-zinc-200 transition-colors">
                          {cleanLinkedInContent(item.content, item.platform)}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewFull(item);
                              }}
                              className="text-xs text-zinc-500 hover:text-zinc-300 font-mono uppercase tracking-wider transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(cleanLinkedInContent(item.content, item.platform), item.id);
                              }}
                              className="text-xs text-zinc-500 hover:text-zinc-300 font-mono uppercase tracking-wider transition-colors"
                            >
                              {copiedId === item.id ? "Copied" : "Copy"}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteText(item.id);
                              }}
                              disabled={deleting === item.id}
                              className="text-xs text-zinc-600 hover:text-red-400 font-mono uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                              {deleting === item.id ? "..." : "Delete"}
                            </button>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExport(item);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-500 font-mono uppercase tracking-wider transition-colors"
                          >
                            Export
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : filteredImageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
              <div className="w-16 h-16 border border-zinc-800 flex items-center justify-center mb-6">
                <ImageIcon className="w-8 h-8 text-zinc-700" />
              </div>
              <p className="font-mono text-sm text-zinc-500 uppercase tracking-wider">No saved mockups</p>
              <p className="font-mono text-[11px] text-zinc-700 mt-2">
                Use "Save to Library" in the Shots editor
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImageItems.map((item, index) => (
                <div
                  key={item.id}
                  className="group transition-all duration-100"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div
                    className="relative aspect-video overflow-hidden bg-zinc-900 border border-zinc-900 hover:border-zinc-800 cursor-pointer transition-all duration-100"
                    onClick={() => setSelectedImage(item)}
                  >
                    <img
                      src={item.src}
                      alt="Saved mockup"
                      className="w-full h-full object-cover transition-all duration-100 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/40 transition-all duration-100" />
                  </div>
                  <div className="flex items-center justify-between mt-3 px-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedImage(item)}
                        className="text-xs text-zinc-600 hover:text-zinc-400 font-mono uppercase tracking-wider transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(item)}
                        className="text-xs text-zinc-600 hover:text-zinc-400 font-mono uppercase tracking-wider transition-colors"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => handleDeleteImage(item.id)}
                        className="text-xs text-zinc-700 hover:text-red-400 font-mono uppercase tracking-wider transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                    <button
                      onClick={() => handleExport(item)}
                      className="text-xs text-blue-400 hover:text-blue-500 font-mono uppercase tracking-wider transition-colors"
                    >
                      Export
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Image Preview Dialog - Simplified */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-6xl w-full bg-zinc-950 border-0 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage.src}
                alt="Mockup preview"
                className="w-full h-auto"
              />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent flex items-center justify-between">
                <div className="flex gap-4">
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteImage(selectedImage.id);
                      setSelectedImage(null);
                    }}
                    className="font-mono text-xs uppercase tracking-wider text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
                <button
                  onClick={() => handleExport(selectedImage)}
                  className="font-mono text-xs uppercase tracking-wider text-blue-400 hover:text-blue-500 transition-colors"
                >
                  Export
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Text Preview Dialog - Simplified */}
      <Dialog open={!!selectedText} onOpenChange={(open) => !open && setSelectedText(null)}>
        <DialogContent className="max-w-2xl w-full bg-zinc-950 border-0 p-12">
          <DialogTitle className="sr-only">Content Preview</DialogTitle>
          {selectedText && (
            <div>
              <div className="flex items-center gap-2 mb-8">
                {selectedText.platform && (
                  <>
                    {(() => {
                      const PlatformIcon = platformIcons[selectedText.platform] || FileIcon;
                      return <PlatformIcon className="w-4 h-4 text-zinc-600" />;
                    })()}
                    <span className="text-xs text-zinc-600 uppercase tracking-wider font-mono">
                      {getPlatformLabel(selectedText.platform)}
                    </span>
                  </>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto mb-8">
                <p className="text-base text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {cleanLinkedInContent(selectedText.content, selectedText.platform)}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-zinc-900">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => handleCopy(cleanLinkedInContent(selectedText.content, selectedText.platform), selectedText.id)}
                    className="font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {copiedId === selectedText.id ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteText(selectedText.id);
                      setSelectedText(null);
                    }}
                    disabled={deleting === selectedText.id}
                    className="font-mono text-xs uppercase tracking-wider text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deleting === selectedText.id ? "..." : "Delete"}
                  </button>
                </div>
                <button
                  onClick={() => handleExport(selectedText)}
                  className="font-mono text-xs uppercase tracking-wider text-blue-400 hover:text-blue-500 transition-colors"
                >
                  Export
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Compose Modal - Combine Text + Image */}
      <Dialog open={showCompose} onOpenChange={(open) => {
        if (!open) {
          setShowCompose(false);
          setComposeText(null);
          setComposeImage(null);
          setComposeStep('text');
          setComposeTextSearch('');
          setComposeImageSearch('');
        }
      }}>
        <DialogContent className="max-w-3xl w-full max-h-[90vh] bg-zinc-950 border border-zinc-900 p-0 overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Compose Post</DialogTitle>

          {/* Fixed Header */}
          <div className="p-8 pb-4 border-b border-zinc-900">
            <h2 className="font-mono text-sm uppercase tracking-wider text-zinc-300 mb-2">
              {composeStep === 'text' ? 'Step 1: Select Text' : 'Step 2: Select Image'}
            </h2>
            <p className="font-mono text-[11px] text-zinc-600">
              {composeStep === 'text' ? 'Choose a text post from your library' : 'Choose an image from your library'}
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 pt-6">
            {composeStep === 'text' ? (
              <div>
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <SearchIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                    <input
                      type="text"
                      value={composeTextSearch}
                      onChange={(e) => setComposeTextSearch(e.target.value)}
                      placeholder="Search text posts..."
                      className="w-full bg-transparent border-b border-zinc-800 text-zinc-300 placeholder:text-zinc-700 font-mono text-sm pl-6 pr-8 py-2 focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                    {composeTextSearch && (
                      <button
                        onClick={() => setComposeTextSearch('')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-zinc-500 transition-colors"
                      >
                        <CloseIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Text Items */}
                <div className="space-y-2">
                  {textItems
                    .filter(item => {
                      if (!composeTextSearch) return true;
                      const query = composeTextSearch.toLowerCase();
                      return (
                        item.content.toLowerCase().includes(query) ||
                        (item.platform && item.platform.toLowerCase().includes(query)) ||
                        (item.title && item.title.toLowerCase().includes(query))
                      );
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setComposeText(item)}
                        className={cn(
                          "p-4 border cursor-pointer transition-all",
                          composeText?.id === item.id
                            ? "border-blue-500/50 bg-blue-500/10"
                            : "border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          {item.platform && (
                            <span className="text-[10px] text-zinc-600 uppercase font-mono">
                              {getPlatformLabel(item.platform)}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-700 font-mono">
                            {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                          {cleanLinkedInContent(item.content, item.platform)}
                        </p>
                      </div>
                    ))}
                  {textItems.filter(item => {
                    if (!composeTextSearch) return true;
                    const query = composeTextSearch.toLowerCase();
                    return (
                      item.content.toLowerCase().includes(query) ||
                      (item.platform && item.platform.toLowerCase().includes(query)) ||
                      (item.title && item.title.toLowerCase().includes(query))
                    );
                  }).length === 0 && (
                    <div className="text-center py-12 text-zinc-700 font-mono text-[11px]">
                      {composeTextSearch ? 'No matching text posts' : 'No text items'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <SearchIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                    <input
                      type="text"
                      value={composeImageSearch}
                      onChange={(e) => setComposeImageSearch(e.target.value)}
                      placeholder="Search images by title..."
                      className="w-full bg-transparent border-b border-zinc-800 text-zinc-300 placeholder:text-zinc-700 font-mono text-sm pl-6 pr-8 py-2 focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                    {composeImageSearch && (
                      <button
                        onClick={() => setComposeImageSearch('')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-zinc-500 transition-colors"
                      >
                        <CloseIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Image Items */}
                <div className="grid grid-cols-3 gap-3">
                  {imageItems
                    .filter(item => {
                      if (!composeImageSearch) return true;
                      const query = composeImageSearch.toLowerCase();
                      return item.title && item.title.toLowerCase().includes(query);
                    })
                    .map((item) => (
                      <div key={item.id} className="space-y-2">
                        <div
                          onClick={() => setComposeImage(item)}
                          className={cn(
                            "aspect-video overflow-hidden border cursor-pointer transition-all",
                            composeImage?.id === item.id
                              ? "border-blue-500/50 ring-2 ring-blue-500/30"
                              : "border-zinc-800 hover:border-zinc-700"
                          )}
                        >
                          <img
                            src={item.src}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="block text-[10px] text-zinc-700 font-mono text-center">
                          {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  {imageItems.filter(item => {
                    if (!composeImageSearch) return true;
                    const query = composeImageSearch.toLowerCase();
                    return item.title && item.title.toLowerCase().includes(query);
                  }).length === 0 && (
                    <div className="col-span-3 text-center py-12 text-zinc-700 font-mono text-[11px]">
                      {composeImageSearch ? 'No matching images' : 'No image items'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="p-8 pt-4 border-t border-zinc-900 bg-zinc-950">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (composeStep === 'image') {
                    setComposeStep('text');
                  } else {
                    setShowCompose(false);
                    setComposeText(null);
                    setComposeImage(null);
                    setComposeStep('text');
                    setComposeTextSearch('');
                    setComposeImageSearch('');
                  }
                }}
                className="font-mono text-xs uppercase tracking-wider text-zinc-600 hover:text-zinc-400 transition-colors duration-300 ease-out"
              >
                {composeStep === 'image' ? 'Back' : 'Cancel'}
              </button>

              {composeStep === 'text' ? (
                <button
                  onClick={() => setComposeStep('image')}
                  disabled={!composeText}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-mono text-xs uppercase tracking-wider transition-colors duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleComposeExport}
                  disabled={(!composeText && !composeImage) || isExporting}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-mono text-xs uppercase tracking-wider transition-colors duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? "Exporting..." : "Export to Typefully"}
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { toast } from "sonner";
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
        const data = await localApi.getAll();
        console.log('[Library] Loaded from local API:', data.length, 'items');
        setTextItems(data.filter(item => item.type === "text") as DbLibraryItem[]);
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
        await localApi.delete(id);
        console.log('[Library] Deleted from backend successfully');
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

  const handleDeleteImage = (id: string) => {
    const updated = imageItems.filter(item => item.id !== id);
    setImageItems(updated);
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(updated));
    toast.success("Removed from library");
    if (selectedImage?.id === id) {
      setSelectedImage(null);
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
          await localApi.bulkDelete(idsArray);
          console.log('[Library] Bulk deleted from backend successfully');
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
    const filename = item.title ? `${item.title.replace(/[^a-zA-Z0-9-_]/g, '-')}.png` : `mockup-${item.id}.png`;
    link.download = filename;
    link.href = item.src;
    link.click();
    toast.success("Downloaded");
  };

  const handleViewFull = async (item: DbLibraryItem) => {
    try {
      let fullItem: DbLibraryItem;

      if (IS_LOCAL_MODE) {
        // Fetch full content from local API
        fullItem = await localApi.getOne(item.id);
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
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <ArchiveIcon className="w-5 h-5 text-zinc-500" />
            <h1 className="font-mono text-lg uppercase tracking-wider text-zinc-300">Library</h1>
            <div className="flex-1 h-px bg-zinc-800" />
            <button
              onClick={loadLibraryItems}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors font-mono text-[10px] uppercase tracking-wider"
            >
              ↻ Refresh
            </button>
            <span className="font-mono text-[10px] text-zinc-700 uppercase tracking-widest">
              {currentItems.length} of {totalItems} items
            </span>
          </div>

          {/* Search, Filter, Sort Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "text" ? "Search content..." : "Search mockups..."}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 placeholder:text-zinc-600 font-mono text-xs pl-10 pr-4 py-2.5 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Platform Filter (text tab only) */}
            {activeTab === "text" && availablePlatforms.length > 0 && (
              <div className="flex gap-1 bg-zinc-900 border border-zinc-800 p-1">
                <button
                  onClick={() => setPlatformFilter(null)}
                  className={cn(
                    "px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
                    !platformFilter ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  All
                </button>
                {availablePlatforms.map(platform => {
                  const PlatformIcon = platformIcons[platform] || FileIcon;
                  return (
                    <button
                      key={platform}
                      onClick={() => setPlatformFilter(platform === platformFilter ? null : platform)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
                        platformFilter === platform ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <PlatformIcon className="w-3 h-3" />
                      {getPlatformLabel(platform)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sort */}
            <button
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
            >
              <SortIcon className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase tracking-wider">
                {sortOrder === "newest" ? "Newest" : "Oldest"}
              </span>
            </button>

            {/* Selection Mode Toggle */}
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedIds(new Set());
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 border transition-colors",
                isSelectionMode 
                  ? "bg-zinc-200 text-zinc-900 border-zinc-200" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              <CheckboxIcon className="w-4 h-4" checked={isSelectionMode} />
              <span className="font-mono text-[10px] uppercase tracking-wider">Select</span>
            </button>
          </div>

          {/* Bulk Actions Bar */}
          {isSelectionMode && selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-6 p-3 bg-zinc-900 border border-zinc-800 animate-fade-in">
              <div className="w-1.5 h-1.5 bg-zinc-500" />
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                {selectedIds.size} selected
              </span>
              <div className="flex-1 h-px bg-zinc-800" />
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  const items = activeTab === "text" ? filteredTextItems : filteredImageItems;
                  setSelectedIds(new Set(items.map((i: DbLibraryItem | LocalLibraryItem) => i.id)));
                }}
                className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white hover:bg-red-600 transition-colors font-mono text-[10px] uppercase tracking-wider"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                Delete Selected
              </button>
            </div>
          )}

          {/* Industrial Tabs */}
          <div className="flex gap-px bg-zinc-800 p-px mb-8 max-w-md">
            <button
              onClick={() => {
                setActiveTab("text");
                setSelectedIds(new Set());
                setSearchQuery("");
                setPlatformFilter(null);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 font-mono text-xs uppercase tracking-wider transition-all duration-150 border-l-2",
                activeTab === "text"
                  ? "bg-zinc-300 text-zinc-900 border-zinc-400"
                  : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border-transparent"
              )}
            >
              <FileIcon className="w-4 h-4" />
              Written Content
              {textItems.length > 0 && (
                <span className={cn(
                  "ml-1 px-2 py-0.5 text-[10px]",
                  activeTab === "text" ? "bg-zinc-900/20" : "bg-zinc-800"
                )}>
                  {textItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("image");
                setSelectedIds(new Set());
                setSearchQuery("");
                loadLibraryItems(); // Refresh when switching to images tab
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 font-mono text-xs uppercase tracking-wider transition-all duration-150 border-l-2",
                activeTab === "image"
                  ? "bg-zinc-300 text-zinc-900 border-zinc-400"
                  : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border-transparent"
              )}
            >
              <ImageIcon className="w-4 h-4" />
              Images
              {imageItems.length > 0 && (
                <span className={cn(
                  "ml-1 px-2 py-0.5 text-[10px]",
                  activeTab === "image" ? "bg-zinc-900/20" : "bg-zinc-800"
                )}>
                  {imageItems.length}
                </span>
              )}
            </button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTextItems.map((item, index) => {
                  const PlatformIcon = item.platform ? platformIcons[item.platform] : FileIcon;
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => isSelectionMode && toggleSelection(item.id)}
                      className={cn(
                        "bg-zinc-900/50 rounded-lg border transition-all duration-200 cursor-pointer group",
                        isSelected
                          ? "border-zinc-500 shadow-lg shadow-zinc-500/10"
                          : "border-zinc-800/50 hover:border-zinc-700/50 hover:bg-zinc-900/70",
                        isSelectionMode && "cursor-pointer"
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          {isSelectionMode && (
                            <CheckboxIcon
                              className={cn(
                                "w-4 h-4 transition-colors flex-shrink-0",
                                isSelected ? "text-zinc-300" : "text-zinc-600"
                              )}
                              checked={isSelected}
                            />
                          )}
                          <PlatformIcon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                          <span className="text-xs text-zinc-500">
                            {getPlatformLabel(item.platform)}
                          </span>
                          <span className="text-xs text-zinc-700 ml-auto">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {item.title && (
                          <h3 className="text-base text-zinc-200 mb-3 font-medium">{item.title}</h3>
                        )}

                        <p className="text-sm text-zinc-400 line-clamp-4 mb-5 leading-relaxed">
                          {cleanLinkedInContent(item.content, item.platform)}
                        </p>

                        {!isSelectionMode && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewFull(item);
                              }}
                              className="flex-1 px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 rounded transition-colors"
                            >
                              View Full
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(cleanLinkedInContent(item.content, item.platform), item.id);
                              }}
                              className="p-2 bg-zinc-800/50 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                              title="Copy"
                            >
                              {copiedId === item.id ? (
                                <CheckIcon className="w-4 h-4" />
                              ) : (
                                <CopyIcon className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteText(item.id);
                              }}
                              disabled={deleting === item.id}
                              className="p-2 bg-zinc-800/50 text-zinc-600 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deleting === item.id ? (
                                <LoaderIcon className="w-4 h-4" />
                              ) : (
                                <TrashIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
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
              <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 max-w-md">
                <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Debug Info</p>
                <p className="font-mono text-[10px] text-zinc-600">
                  Total images in storage: {imageItems.length}
                </p>
                <p className="font-mono text-[10px] text-zinc-600">
                  Storage key: {LIBRARY_STORAGE_KEY}
                </p>
                <button
                  onClick={() => {
                    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
                    alert(raw ? `Found ${JSON.parse(raw).length} images in localStorage` : 'No data in localStorage');
                  }}
                  className="mt-3 px-3 py-1.5 bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-mono text-[10px] uppercase tracking-wider"
                >
                  Check Storage
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredImageItems.map((item, index) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => isSelectionMode && toggleSelection(item.id)}
                    className={cn(
                      "group bg-zinc-900 border transition-all duration-150 overflow-hidden",
                      isSelected 
                        ? "border-zinc-400 ring-1 ring-zinc-400" 
                        : "border-zinc-800 hover:border-zinc-700",
                      isSelectionMode && "cursor-pointer"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Top bar */}
                    <div className={cn(
                      "h-1 transition-colors",
                      isSelected 
                        ? "bg-zinc-400" 
                        : "bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700"
                    )} />
                    
                    <div className="relative">
                      {isSelectionMode && (
                        <div className="absolute top-3 left-3 z-10">
                          <CheckboxIcon 
                            className={cn(
                              "w-5 h-5 transition-colors drop-shadow-lg",
                              isSelected ? "text-zinc-200" : "text-zinc-400"
                            )} 
                            checked={isSelected} 
                          />
                        </div>
                      )}
                      <img
                        src={item.src}
                        alt="Saved mockup"
                        className={cn(
                          "w-full aspect-video object-cover transition-transform duration-200",
                          isSelected && "scale-[0.98]"
                        )}
                      />
                      {!isSelectionMode && (
                        <div className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/60 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(item);
                            }}
                            className="p-2.5 bg-zinc-200 text-zinc-900 hover:bg-zinc-100 transition-colors"
                          >
                            <ExpandIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item);
                            }}
                            className="p-2.5 bg-zinc-200 text-zinc-900 hover:bg-zinc-100 transition-colors"
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(item.id);
                            }}
                            className="p-2.5 bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 border-t border-zinc-800">
                      {item.title && (
                        <p className="font-mono text-xs text-zinc-300 truncate mb-1">{item.title}</p>
                      )}
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-zinc-700 mr-2" />
                        <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
                          {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          {isSelectionMode && (
            <div className="mt-8 flex items-center justify-center gap-6 text-zinc-700">
              <span className="font-mono text-[10px] uppercase tracking-wider">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 mr-1">Esc</kbd> Exit
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 mr-1">⌘A</kbd> Select All
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 mr-1">Del</kbd> Delete
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-5xl w-full bg-zinc-950 border-zinc-800 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {selectedImage && (
            <div className="relative">
              <div className="h-1 bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-700" />
              <img
                src={selectedImage.src}
                alt="Mockup preview"
                className="w-full h-auto"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-zinc-600" />
                  <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                    {new Date(selectedImage.createdAt).toLocaleDateString()} • {new Date(selectedImage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="p-2 bg-zinc-200 text-zinc-900 hover:bg-zinc-100 transition-colors"
                  >
                    <DownloadIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteImage(selectedImage.id)}
                    className="p-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Text Preview Dialog */}
      <Dialog open={!!selectedText} onOpenChange={(open) => !open && setSelectedText(null)}>
        <DialogContent className="max-w-3xl w-full bg-zinc-950 border-zinc-800/50 rounded-lg p-0 overflow-hidden">
          <DialogTitle className="sr-only">Content Preview</DialogTitle>
          {selectedText && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800/50">
                {selectedText.platform && (
                  <>
                    {(() => {
                      const PlatformIcon = platformIcons[selectedText.platform] || FileIcon;
                      return <PlatformIcon className="w-4 h-4 text-zinc-500" />;
                    })()}
                    <span className="text-sm text-zinc-500">
                      {getPlatformLabel(selectedText.platform)}
                    </span>
                  </>
                )}
                <span className="text-xs text-zinc-700 ml-auto">
                  {new Date(selectedText.created_at).toLocaleDateString()}
                </span>
              </div>

              {selectedText.title && (
                <h2 className="text-xl text-zinc-200 mb-6 font-medium">{selectedText.title}</h2>
              )}

              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-base text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {cleanLinkedInContent(selectedText.content, selectedText.platform)}
                </p>
              </div>

              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-zinc-800/50">
                <button
                  onClick={() => handleCopy(cleanLinkedInContent(selectedText.content, selectedText.platform), selectedText.id)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 rounded transition-colors text-sm"
                >
                  {copiedId === selectedText.id ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteText(selectedText.id)}
                  disabled={deleting === selectedText.id}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-colors text-sm disabled:opacity-50"
                >
                  {deleting === selectedText.id ? (
                    <LoaderIcon className="w-4 h-4" />
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

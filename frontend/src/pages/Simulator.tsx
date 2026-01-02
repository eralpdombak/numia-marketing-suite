import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { localApi } from "@/lib/localApi";
import { cn } from "@/lib/utils";

const IS_LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === 'true';

type Platform = "linkedin" | "twitter";

interface LibraryItem {
  id: string;
  type: "text" | "image";
  content: string;
  platform: string | null;
  created_at: string;
}

interface LocalImageItem {
  id: string;
  src: string;
  createdAt: number;
}

const LIBRARY_STORAGE_KEY = "numia-shots-library";

// Industrial icons
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

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn(className, "animate-spin")}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function SimulatorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

export default function Simulator() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("linkedin");
  const [textItems, setTextItems] = useState<LibraryItem[]>([]);
  const [imageItems, setImageItems] = useState<LocalImageItem[]>([]);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTextPicker, setShowTextPicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  // Auto-refresh in local mode
  useEffect(() => {
    if (!IS_LOCAL_MODE) return;

    const interval = setInterval(() => {
      loadContent();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Load text content
      if (IS_LOCAL_MODE) {
        const data = await localApi.getAll();
        setTextItems(data.filter(item => item.type === "text") as LibraryItem[]);
      } else {
        const { data } = await supabase
          .from("library_items")
          .select("*")
          .eq("type", "text")
          .order("created_at", { ascending: false });

        if (data) setTextItems(data as LibraryItem[]);
      }

      // Load images from localStorage (same for both modes)
      const saved = localStorage.getItem(LIBRARY_STORAGE_KEY);
      if (saved) setImageItems(JSON.parse(saved));
    } catch (e) {
      console.error("Error loading content:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="pt-14">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <SimulatorIcon className="w-5 h-5 text-zinc-500" />
            <h1 className="font-mono text-lg uppercase tracking-wider text-zinc-300">Simulator</h1>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Platform Tabs */}
          <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 w-fit mb-8">
            <button
              onClick={() => setSelectedPlatform("linkedin")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-wider transition-all",
                selectedPlatform === "linkedin"
                  ? "bg-zinc-700 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <LinkedInIcon className="w-4 h-4" />
              LinkedIn
            </button>
            <button
              onClick={() => setSelectedPlatform("twitter")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-wider transition-all",
                selectedPlatform === "twitter"
                  ? "bg-zinc-700 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <TwitterIcon className="w-4 h-4" />
              Twitter/X
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <LoaderIcon className="w-6 h-6 text-zinc-600" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Content Builder */}
              <div>
                <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Content</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Text Selection */}
                  <div
                    onClick={() => textItems.length > 0 && setShowTextPicker(true)}
                    className={cn(
                      "relative border border-dashed p-4 min-h-[120px] transition-all cursor-pointer",
                      selectedText
                        ? "border-zinc-600 bg-zinc-900/50"
                        : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/30",
                      textItems.length === 0 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {selectedText ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedText(null);
                          }}
                          className="absolute top-2 right-2 p-1 hover:bg-zinc-800 transition-colors"
                        >
                          <CloseIcon className="w-4 h-4 text-zinc-500" />
                        </button>
                        <p className="text-sm text-zinc-300 line-clamp-4 pr-8">{selectedText}</p>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                        <PlusIcon className="w-6 h-6 mb-2" />
                        <p className="font-mono text-[10px] uppercase tracking-wider">Add Text</p>
                        <p className="text-[10px] mt-1">
                          {textItems.length > 0
                            ? `${textItems.length} items available`
                            : "No text in library"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Image Selection */}
                  <div
                    onClick={() => imageItems.length > 0 && setShowImagePicker(true)}
                    className={cn(
                      "relative border border-dashed p-4 min-h-[120px] transition-all cursor-pointer overflow-hidden",
                      selectedImage
                        ? "border-zinc-600 bg-zinc-900/50 p-0"
                        : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/30",
                      imageItems.length === 0 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {selectedImage ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(null);
                          }}
                          className="absolute top-2 right-2 z-10 p-1 bg-zinc-900/80 hover:bg-zinc-800 transition-colors"
                        >
                          <CloseIcon className="w-4 h-4 text-zinc-400" />
                        </button>
                        <img
                          src={selectedImage}
                          alt="Selected"
                          className="w-full h-[120px] object-cover"
                        />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                        <PlusIcon className="w-6 h-6 mb-2" />
                        <p className="font-mono text-[10px] uppercase tracking-wider">Add Image</p>
                        <p className="text-[10px] mt-1">
                          {imageItems.length > 0
                            ? `${imageItems.length} items available`
                            : "No images in library"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-4 text-center">
                  Live Preview
                </p>
                {selectedPlatform === "linkedin" ? (
                  <LinkedInMockup text={selectedText} image={selectedImage} />
                ) : (
                  <TwitterMockup text={selectedText} image={selectedImage} />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Text Picker Modal */}
      {showTextPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowTextPicker(false)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 w-full max-w-lg max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-mono text-sm text-zinc-300 uppercase tracking-wider">Select Text</h3>
              <button
                onClick={() => setShowTextPicker(false)}
                className="p-1 hover:bg-zinc-800 transition-colors"
              >
                <CloseIcon className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(70vh-60px)]">
              {textItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedText(item.content);
                    setShowTextPicker(false);
                  }}
                  className={cn(
                    "w-full text-left p-4 border transition-all hover:border-zinc-600",
                    selectedText === item.content
                      ? "border-zinc-500 bg-zinc-900"
                      : "border-zinc-800 bg-zinc-900/50"
                  )}
                >
                  <p className="text-sm text-zinc-300 line-clamp-3">{item.content}</p>
                  <p className="font-mono text-[10px] text-zinc-600 mt-2">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Picker Modal */}
      {showImagePicker && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowImagePicker(false)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 w-full max-w-lg max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-mono text-sm text-zinc-300 uppercase tracking-wider">Select Image</h3>
              <button
                onClick={() => setShowImagePicker(false)}
                className="p-1 hover:bg-zinc-800 transition-colors"
              >
                <CloseIcon className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2 overflow-y-auto max-h-[calc(70vh-60px)]">
              {imageItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedImage(item.src);
                    setShowImagePicker(false);
                  }}
                  className={cn(
                    "border overflow-hidden transition-all",
                    selectedImage === item.src
                      ? "border-zinc-500"
                      : "border-zinc-800 hover:border-zinc-600"
                  )}
                >
                  <img
                    src={item.src}
                    alt="Library item"
                    className="w-full aspect-video object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkedInMockup({ text, image }: { text: string | null; image: string | null }) {
  const hasContent = text || image;

  return (
    <div className="bg-white overflow-hidden max-w-lg mx-auto shadow-2xl">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">Your Name</p>
          <p className="text-xs text-gray-500 truncate">Your headline here</p>
          <p className="text-xs text-gray-400 flex items-center gap-1">1h • 🌐</p>
        </div>
      </div>

      {/* Content */}
      {hasContent ? (
        <>
          {text && (
            <div className="px-4 pb-3">
              <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{text}</p>
            </div>
          )}
          {image && (
            <img src={image} alt="Post content" className="w-full" />
          )}
        </>
      ) : (
        <div className="px-4 pb-6 pt-2">
          <div className="py-12 text-center text-gray-300 text-sm border-2 border-dashed border-gray-200">
            Add text or image to preview
          </div>
        </div>
      )}

      {/* Engagement */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <span className="flex -space-x-1">
            <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px]">👍</span>
            <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[8px]">❤️</span>
          </span>
          <span>124</span>
        </div>
        <span>18 comments • 3 reposts</span>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-between border-t border-gray-100 text-gray-600 text-sm font-medium">
        <button className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-50">Like</button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-50">Comment</button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-50">Repost</button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-gray-50">Send</button>
      </div>
    </div>
  );
}

function TwitterMockup({ text, image }: { text: string | null; image: string | null }) {
  const hasContent = text || image;

  return (
    <div className="bg-black border border-gray-800 overflow-hidden max-w-lg mx-auto">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <p className="font-bold text-white text-[15px]">Your Name</p>
            <span className="text-gray-500 text-[15px]">@yourhandle</span>
            <span className="text-gray-500 text-[15px]">· 1h</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {hasContent ? (
        <div className="px-4 pb-3 -mt-1">
          {text && (
            <p className="text-white text-[15px] whitespace-pre-wrap leading-relaxed mb-3">{text}</p>
          )}
          {image && (
            <img src={image} alt="Post content" className="w-full rounded-2xl border border-gray-800" />
          )}
        </div>
      ) : (
        <div className="px-4 pb-4">
          <div className="py-12 text-center text-gray-600 text-sm border border-dashed border-gray-700">
            Add text or image to preview
          </div>
        </div>
      )}

      {/* Engagement */}
      <div className="px-4 py-3 flex items-center gap-6 text-gray-500 text-[13px]">
        <span className="hover:text-blue-400 cursor-pointer">💬 24</span>
        <span className="hover:text-green-400 cursor-pointer">🔁 12</span>
        <span className="hover:text-pink-400 cursor-pointer">❤️ 156</span>
        <span className="ml-auto hover:text-blue-400 cursor-pointer">📤</span>
      </div>
    </div>
  );
}

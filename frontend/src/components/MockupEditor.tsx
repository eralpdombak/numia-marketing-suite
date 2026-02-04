import { useState, useRef, useCallback, useEffect } from "react";
import { MockupCanvas } from "./MockupCanvas";
import { ControlPanel } from "./ControlPanel";
import { Canvas3DRenderer } from "./Canvas3DRenderer";
import { MockupSettings, UploadedImage, SavedPreset } from "@/types/mockup";
import { toast } from "@/components/ui/sonner";
import { Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import bg1 from "@/assets/backgrounds/bg-1.svg";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const PRESETS_STORAGE_KEY = "numia-shots-presets";
const LIBRARY_STORAGE_KEY = "numia-shots-library";

const defaultSettings: MockupSettings = {
  deviceType: 'none',
  backgroundColor: bg1,
  borderRadius: 16,
  imageRadius: 0,
  imageScale: 100,
  browserScale: 100,
  shadow: true,
  deviceColor: 'black',
  brandingPosition: 'top-left',
};

export function MockupEditor() {
  const [settings, setSettings] = useState<MockupSettings>(defaultSettings);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [showTitleDialog, setShowTitleDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"export" | "save" | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const canvasRef = useRef<HTMLElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  const handleSettingsChange = useCallback((newSettings: Partial<MockupSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };

      // Sync scales when switching device types to maintain visual size
      if (newSettings.deviceType && newSettings.deviceType !== prev.deviceType) {
        if (newSettings.deviceType === 'browser' && prev.deviceType === 'none') {
          // Switching to browser: map imageScale (30-100) to browserScale (58-100)
          // 30% imageScale -> 58% browserScale
          // 100% imageScale -> 100% browserScale
          const normalized = (prev.imageScale - 30) / 70; // 0 to 1
          updated.browserScale = Math.round(58 + normalized * 42); // 58 to 100
        } else if (newSettings.deviceType === 'none' && prev.deviceType === 'browser') {
          // Switching to none: map browserScale (58-100) to imageScale (30-100)
          // 58% browserScale -> 30% imageScale
          // 100% browserScale -> 100% imageScale
          const normalized = (prev.browserScale - 58) / 42; // 0 to 1
          updated.imageScale = Math.round(30 + normalized * 70); // 30 to 100
        }
      }

      return updated;
    });
  }, []);

  const handleImageUpload = useCallback((uploadedImage: UploadedImage) => {
    setImage(uploadedImage);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImage(null);
  }, []);

  const captureCanvas = useCallback(async (format: 'png' | 'jpeg' = 'png'): Promise<string | null> => {
    // Try to use canvas-based renderer first (better quality)
    if (image && exportCanvasRef.current) {
      try {
        console.log('[Capture] Using canvas-based renderer...');
        console.log('[Capture] Has exportCanvasRef:', !!exportCanvasRef.current);

        // Wait for canvas to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!exportCanvasRef.current) {
          console.error('[Capture] Export canvas not available');
          throw new Error('Export canvas not ready - trying fallback');
        }

        console.log('[Capture] Canvas dimensions:', exportCanvasRef.current.width, 'x', exportCanvasRef.current.height);
        // Use PNG for exports (lossless), JPEG for library saves (smaller size)
        const dataUrl = format === 'png'
          ? exportCanvasRef.current.toDataURL('image/png')
          : exportCanvasRef.current.toDataURL('image/jpeg', 0.95);
        console.log('[Capture] Canvas export complete, format:', format, 'length:', dataUrl.length);
        return dataUrl;
      } catch (error) {
        console.error("[Capture] Canvas failed, falling back to html2canvas:", error);
        // Don't show error, just fall through to html2canvas
      }
    }

    // Fallback to html2canvas for non-3D captures
    if (!canvasRef.current) {
      console.error('[Capture] No canvas ref');
      return null;
    }

    try {
      console.log('[Capture] Capturing with html2canvas...');

      const element = canvasRef.current as HTMLElement;

      // Force a reflow to ensure all styles are applied
      element.offsetHeight;

      // Wait for all animations, transforms, and images to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture with html2canvas
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 5000,
        foreignObjectRendering: false,
        removeContainer: true,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-capture="true"]');
          if (clonedElement) {
            const images = clonedElement.querySelectorAll('img');
            images.forEach(img => {
              img.style.opacity = '1';
              img.style.display = 'block';
            });
          }
        }
      });

      console.log('[Capture] Canvas created:', canvas.width, 'x', canvas.height);

      // Use PNG for exports (lossless), JPEG for library saves
      const dataUrl = format === 'png'
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', 0.95);
      console.log('[Capture] Data URL length:', dataUrl.length);

      return dataUrl;
    } catch (error) {
      console.error("[Capture] Failed:", error);
      toast.error(`Capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }, [image]);

  const handleExportClick = useCallback(() => {
    setTitleInput("");
    setPendingAction("export");
    setShowTitleDialog(true);
  }, []);

  const handleSaveToLibraryClick = useCallback(() => {
    setTitleInput("");
    setPendingAction("save");
    setShowTitleDialog(true);
  }, []);

  const handleConfirmWithTitle = useCallback(async () => {
    if (!canvasRef.current) return;
    
    const title = titleInput.trim();
    setShowTitleDialog(false);
    
    if (pendingAction === "export") {
      setIsExporting(true);
      try {
        // Use PNG for exports - highest quality
        const dataUrl = await captureCanvas('png');
        if (!dataUrl) throw new Error("Capture failed");

        const link = document.createElement('a');
        const filename = title ? `${title.replace(/[^a-zA-Z0-9-_]/g, '-')}.png` : `mockup-${Date.now()}.png`;
        link.download = filename;
        link.href = dataUrl;
        link.click();

        toast.success("Exported");
      } catch (error) {
        toast.error("Export failed");
        console.error(error);
      } finally {
        setIsExporting(false);
      }
    } else if (pendingAction === "save") {
      setIsSavingToLibrary(true);
      try {
        console.log('[MockupEditor] Starting save to library...');
        // Use JPEG for library - smaller file size
        const dataUrl = await captureCanvas('jpeg');

        if (!dataUrl) {
          console.error('[MockupEditor] captureCanvas returned null');
          throw new Error("Capture failed - no data returned");
        }

        console.log('[MockupEditor] Got data URL, uploading to server...');

        // Upload to server to get public URL
        const API_URL = import.meta.env.VITE_LOCAL_MODE === 'true'
          ? 'http://localhost:3001'
          : '';

        const uploadResponse = await fetch(`${API_URL}/api/library/upload-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: dataUrl,
            title: title || undefined,
          }),
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || 'Upload failed');
        }

        const { url, filename } = await uploadResponse.json();
        console.log('[MockupEditor] Image uploaded:', filename);

        // Save image metadata with public URL to localStorage
        let savedImages = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY) || '[]');
        const newImage = {
          id: crypto.randomUUID(),
          src: url,  // Public URL instead of base64
          createdAt: Date.now(),
          title: title || undefined,
          filename,  // Store filename for deletion
        };
        savedImages.push(newImage);

        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(savedImages));
        console.log('[MockupEditor] Image saved successfully');

        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('localStorageUpdate'));

        toast.success("Saved to library");
      } catch (error) {
        toast.error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('[MockupEditor] Save error:', error);
      } finally {
        setIsSavingToLibrary(false);
      }
    }
    
    setPendingAction(null);
    setTitleInput("");
  }, [captureCanvas, pendingAction, titleInput]);

  const handleSavePreset = useCallback((name: string) => {
    const newPreset: SavedPreset = {
      id: crypto.randomUUID(),
      name,
      settings: { ...settings },
    };
    setPresets(prev => [...prev, newPreset]);
    toast.success(`Preset "${name}" saved`);
  }, [settings]);

  const handleLoadPreset = useCallback((preset: SavedPreset) => {
    setSettings(preset.settings);
    toast.success(`Loaded "${preset.name}"`);
  }, []);

  const handleDeletePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    toast.success("Preset deleted");
  }, []);

  const handleSaveToLibrary = useCallback(async () => {
    // This is now handled through the dialog flow
    handleSaveToLibraryClick();
  }, [handleSaveToLibraryClick]);

  const isImageBackground = settings.backgroundColor.startsWith('data:') ||
                            settings.backgroundColor.startsWith('http') ||
                            settings.backgroundColor.startsWith('/') ||
                            settings.backgroundColor.endsWith('.svg') ||
                            settings.backgroundColor.endsWith('.png') ||
                            settings.backgroundColor.endsWith('.jpg');

  return (
    <div className="min-h-screen pt-14">
      {/* Hidden canvas-based renderer for exports - disabled to prevent blocking UI */}
      {/* {image && (
        <Canvas3DRenderer
          settings={settings}
          image={image}
          backgroundImage={isImageBackground ? settings.backgroundColor : undefined}
          width={3840}
          height={2400}
          onCanvasReady={(canvas) => {
            console.log('[MockupEditor] Canvas ready callback triggered');
            exportCanvasRef.current = canvas;
          }}
        />
      )} */}

      <div className="h-[calc(100vh-56px)] flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 p-4 md:p-8 lg:p-12 flex flex-col justify-center items-center bg-background min-w-0">
          <div className="w-full max-w-4xl">
            <MockupCanvas
              ref={canvasRef}
              settings={settings}
              image={image}
              onImageUpload={handleImageUpload}
            />
            <div className="h-14 flex items-center justify-center pt-4">
              {image && (
                <button
                  onClick={handleRemoveImage}
                  className="px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-zinc-600 hover:text-red-400 border border-zinc-800 hover:border-red-900/50 bg-zinc-950 hover:bg-red-950/20 transition-colors duration-300 ease-out flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="w-56 md:w-64 xl:w-72 border-l border-zinc-800 bg-zinc-900/50 flex-shrink-0">
          <div className="h-full overflow-y-auto overflow-x-hidden pl-3 md:pl-4 xl:pl-5 pr-3 md:pr-4 xl:pr-5 py-3 md:py-4 xl:py-5">
            <ControlPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onExport={handleExportClick}
              isExporting={isExporting}
              presets={presets}
              onSavePreset={handleSavePreset}
              onLoadPreset={handleLoadPreset}
              onDeletePreset={handleDeletePreset}
              onSaveToLibrary={handleSaveToLibrary}
              isSavingToLibrary={isSavingToLibrary}
              hasImage={!!image}
            />
          </div>
        </div>
      </div>

      {/* Title Input Dialog */}
      <Dialog open={showTitleDialog} onOpenChange={(open) => !open && setShowTitleDialog(false)}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Name your mockup</DialogTitle>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-zinc-500" />
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                {pendingAction === "export" ? "Export" : "Save to Library"}
              </span>
            </div>
            
            <label className="block font-mono text-xs text-zinc-400 mb-2 uppercase tracking-wider">
              Title (optional)
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="My awesome mockup..."
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 placeholder:text-zinc-600 font-mono text-sm px-4 py-3 focus:outline-none focus:border-zinc-600 transition-colors duration-300 ease-out"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirmWithTitle();
                }
              }}
            />
            <p className="font-mono text-[10px] text-zinc-600 mt-2">
              Used as filename when exporting and for search in library
            </p>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowTitleDialog(false)}
                className="flex-1 px-4 py-2.5 bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors font-mono text-[11px] uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWithTitle}
                className="flex-1 px-4 py-2.5 bg-zinc-200 text-zinc-900 hover:bg-zinc-100 transition-colors font-mono text-[11px] uppercase tracking-wider"
              >
                {pendingAction === "export" ? "Export" : "Save"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { forwardRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { DeviceFrame } from "./DeviceFrames";
import { MockupSettings, UploadedImage } from "@/types/mockup";
import { Upload } from "lucide-react";

interface MockupCanvasProps {
  settings: MockupSettings;
  image: UploadedImage | null;
  onImageUpload?: (image: UploadedImage) => void;
  className?: string;
}

export const MockupCanvas = forwardRef<HTMLElement, MockupCanvasProps>(
  ({ settings, image, onImageUpload, className }, ref) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0 && onImageUpload) {
        processFile(files[0], onImageUpload);
      }
    }, [onImageUpload]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0 && onImageUpload) {
        processFile(files[0], onImageUpload);
      }
    }, [onImageUpload]);

    const processFile = (file: File, callback: (image: UploadedImage) => void) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        callback({
          id: crypto.randomUUID(),
          src,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    };

    const isImageBackground = settings.backgroundColor.startsWith('data:') || 
                              settings.backgroundColor.startsWith('http') || 
                              settings.backgroundColor.startsWith('/') ||
                              settings.backgroundColor.endsWith('.svg') ||
                              settings.backgroundColor.endsWith('.png') ||
                              settings.backgroundColor.endsWith('.jpg');

    const backgroundStyle = isImageBackground
      ? {
          backgroundImage: `url(${settings.backgroundColor})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      : { backgroundColor: settings.backgroundColor };

    // Single label element - no conditional rendering to prevent remounting
    return (
      <label
        ref={ref as React.Ref<HTMLLabelElement>}
        data-capture="true"
        className={cn(
          "relative aspect-[16/10] w-full overflow-visible flex items-center justify-center group",
          settings.deviceType === 'none' && "p-8",
          !image && "cursor-pointer",
          isDragging && "ring-1 ring-foreground/20",
          className
        )}
        style={{
          borderRadius: settings.borderRadius,
        }}
        onDragEnter={!image ? handleDragIn : undefined}
        onDragLeave={!image ? handleDragOut : undefined}
        onDragOver={!image ? handleDrag : undefined}
        onDrop={!image ? handleDrop : undefined}
      >
        {/* Persistent background layer - never unmounts */}
        <div
          className="absolute inset-0 transition-all duration-200 ease-out pointer-events-none"
          style={{
            borderRadius: settings.borderRadius,
            ...backgroundStyle,
          }}
        />
        {/* Branding */}
        {settings.brandingPosition !== 'none' && (
          <span className={cn(
            "absolute font-poppins font-bold text-foreground/90 text-base z-10 tracking-tight",
            settings.brandingPosition === 'top-left' && "top-3 left-4",
            settings.brandingPosition === 'top-right' && "top-3 right-4",
            settings.brandingPosition === 'bottom-left' && "bottom-3 left-4",
            settings.brandingPosition === 'bottom-right' && "bottom-3 right-4"
          )}>
            NUMIA
          </span>
        )}
        {!image && (
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        )}

        {/* None mode - direct image */}
        {settings.deviceType === 'none' && (
          <>
            {image ? (
              <div className="absolute inset-0 flex items-center justify-center z-[1]">
                <img
                  src={image.src}
                  alt={image.name}
                  className={cn(
                    "max-w-full max-h-full object-contain transition-transform duration-200 ease-out",
                    settings.shadow && "device-shadow"
                  )}
                  style={{
                    borderRadius: settings.imageRadius,
                    transform: `scale(${settings.imageScale / 100})`,
                    opacity: 1,
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 relative z-[1]">
                <div className="w-12 h-12 border border-zinc-500 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-zinc-400" />
                </div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  {isDragging ? "Release to upload" : "Drop image or click"}
                </p>
              </div>
            )}
          </>
        )}

        {/* Browser mode - image in frame */}
        {settings.deviceType === 'browser' && (
          <div
            className="flex items-center justify-center w-full p-8 transition-all duration-200 ease-out relative z-[1]"
            style={{
              maxWidth: `${settings.browserScale}%`,
            }}
          >
            <DeviceFrame
              deviceType={settings.deviceType}
              deviceColor={settings.deviceColor}
              className={cn(
                settings.shadow && "device-shadow"
              )}
            >
              {image ? (
                <img
                  src={image.src}
                  alt={image.name}
                  className="w-full h-full object-cover"
                  style={{ opacity: 1 }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 border border-zinc-500 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    {isDragging ? "Release to upload" : "Drop image or click"}
                  </p>
                </div>
              )}
            </DeviceFrame>
          </div>
        )}
      </label>
    );
  }
);

MockupCanvas.displayName = "MockupCanvas";
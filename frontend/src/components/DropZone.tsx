import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, Image as ImageIcon } from "lucide-react";
import { UploadedImage } from "@/types/mockup";

interface DropZoneProps {
  onImageUpload: (image: UploadedImage) => void;
  className?: string;
}

export function DropZone({ onImageUpload, className }: DropZoneProps) {
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
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      onImageUpload({
        id: crypto.randomUUID(),
        src,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <label
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300",
        isDragging
          ? "border-primary bg-primary/10 scale-[1.02]"
          : "border-border hover:border-muted-foreground/50 hover:bg-secondary/50",
        className
      )}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
        isDragging ? "bg-primary/20" : "bg-secondary"
      )}>
        {isDragging ? (
          <Upload className="w-8 h-8 text-primary animate-bounce" />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium">
          {isDragging ? "Drop your image here" : "Drag & drop your screenshot"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse
        </p>
      </div>
    </label>
  );
}

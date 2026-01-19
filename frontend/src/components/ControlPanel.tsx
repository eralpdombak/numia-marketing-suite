import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MockupSettings, DeviceType, SavedPreset, BrandingPosition } from "@/types/mockup";
import { Loader2 } from "lucide-react";

import bg1 from "@/assets/backgrounds/bg-1.svg";
import bg2 from "@/assets/backgrounds/bg-2.svg";
import bg3 from "@/assets/backgrounds/bg-3.svg";
import bg4 from "@/assets/backgrounds/bg-4.svg";

interface BackgroundPreset {
  id: string;
  name: string;
  image: string;
}

const backgroundPresets: BackgroundPreset[] = [
  { id: "preset-1", name: "Gradient 1", image: bg1 },
  { id: "preset-2", name: "Gradient 2", image: bg2 },
  { id: "preset-3", name: "Gradient 3", image: bg3 },
  { id: "preset-4", name: "Gradient 4", image: bg4 },
];

interface ControlPanelProps {
  settings: MockupSettings;
  onSettingsChange: (settings: Partial<MockupSettings>) => void;
  onExport: () => void;
  isExporting: boolean;
  presets: SavedPreset[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: SavedPreset) => void;
  onDeletePreset: (id: string) => void;
  onSaveToLibrary: () => void;
  isSavingToLibrary: boolean;
}

const devices: { type: DeviceType; label: string }[] = [
  { type: 'none', label: 'None' },
  { type: 'browser', label: 'Browser' },
];

// Industrial icons
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
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

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M8 4v4h8V4" />
      <rect x="8" y="12" width="8" height="6" />
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

function ChevronIcon({ className, open }: { className?: string; open?: boolean }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      className={cn(className, "transition-transform duration-200", open && "rotate-180")}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">
      <span className="w-1.5 h-1.5 bg-zinc-600" />
      {children}
      <span className="flex-1 h-px bg-zinc-800" />
    </label>
  );
}

function Divider() {
  return (
    <div className="relative h-px my-1">
      <div className="absolute inset-0 bg-zinc-800" />
      <div className="absolute left-0 top-0 w-3 h-px bg-zinc-600" />
      <div className="absolute right-0 top-0 w-3 h-px bg-zinc-600" />
    </div>
  );
}

export function ControlPanel({
  settings,
  onSettingsChange,
  onExport,
  isExporting,
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onSaveToLibrary,
  isSavingToLibrary
}: ControlPanelProps) {
  const [presetName, setPresetName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [showBackgrounds, setShowBackgrounds] = useState(false);

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim());
      setPresetName("");
      setShowSaveInput(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5">
            {/* Border Selection */}
      <div className="space-y-3">
        <SectionLabel>Border</SectionLabel>
        <div className="flex gap-px bg-zinc-800 p-px">
          {devices.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => onSettingsChange({ deviceType: type })}
              className={cn(
                "flex-1 py-2 px-4 text-xs font-mono uppercase tracking-wider transition-all duration-100",
                settings.deviceType === type
                  ? "bg-zinc-300 text-zinc-900"
                  : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Size Controls */}
      {settings.deviceType === 'none' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Size</SectionLabel>
            <span className="text-[10px] text-zinc-500 font-mono tabular-nums bg-zinc-800 px-2 py-0.5">{settings.imageScale}%</span>
          </div>
          <Slider
            value={[settings.imageScale]}
            onValueChange={([value]) => onSettingsChange({ imageScale: Math.round(value) })}
            min={30}
            max={100}
            step={1}
          />
        </div>
      )}

      {settings.deviceType === 'browser' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Size</SectionLabel>
            <span className="text-[10px] text-zinc-500 font-mono tabular-nums bg-zinc-800 px-2 py-0.5">{Math.round(((settings.browserScale - 58) / 42) * 100)}%</span>
          </div>
          <Slider
            value={[settings.browserScale]}
            onValueChange={([value]) => onSettingsChange({ browserScale: Math.round(value) })}
            min={58}
            max={100}
            step={1}
          />
        </div>
      )}

      {/* Radius Controls */}
      {settings.deviceType === 'none' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Radius</SectionLabel>
            <span className="text-[10px] text-zinc-500 font-mono tabular-nums bg-zinc-800 px-2 py-0.5">{settings.imageRadius}px</span>
          </div>
          <Slider
            value={[settings.imageRadius]}
            onValueChange={([value]) => onSettingsChange({ imageRadius: Math.round(value) })}
            min={0}
            max={48}
            step={1}
          />
        </div>
      )}

      {settings.deviceType === 'browser' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Radius</SectionLabel>
            <span className="text-[10px] text-zinc-500 font-mono tabular-nums bg-zinc-800 px-2 py-0.5">{settings.borderRadius}px</span>
          </div>
          <Slider
            value={[settings.borderRadius]}
            onValueChange={([value]) => onSettingsChange({ borderRadius: Math.round(value) })}
            min={0}
            max={48}
            step={1}
          />
        </div>
      )}

      <Divider />

      {/* Background Presets */}
      <div className="space-y-3">
        <button
          onClick={() => setShowBackgrounds(!showBackgrounds)}
          className="w-full flex items-center justify-between group"
        >
          <SectionLabel>Backgrounds</SectionLabel>
          <ChevronIcon className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" open={showBackgrounds} />
        </button>
        
        {showBackgrounds && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-150">
            {/* Solid Black option */}
            <button
              onClick={() => onSettingsChange({ backgroundColor: "#000000" })}
              className={cn(
                "w-full py-2 px-3 border text-[11px] font-mono uppercase tracking-wider transition-all duration-100",
                settings.backgroundColor === "#000000"
                  ? "border-zinc-500 bg-zinc-800 text-zinc-200"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              )}
            >
              Solid Black
            </button>

            {/* Gradient presets */}
            <div className="grid grid-cols-2 gap-2">
              {backgroundPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onSettingsChange({ backgroundColor: preset.image })}
                  className={cn(
                    "aspect-video overflow-hidden transition-all duration-100 border",
                    settings.backgroundColor === preset.image
                      ? "border-zinc-400"
                      : "border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <img src={preset.image} alt={preset.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Branding Position */}
      <div className="space-y-3">
        <SectionLabel>Logo</SectionLabel>
        <div className="grid grid-cols-5 gap-px bg-zinc-800 p-px">
          {(['none', 'top-left', 'top-right', 'bottom-left', 'bottom-right'] as BrandingPosition[]).map((position) => (
            <button
              key={position}
              onClick={() => onSettingsChange({ brandingPosition: position })}
              className={cn(
                "py-2 text-xs transition-all duration-100",
                settings.brandingPosition === position
                  ? "bg-zinc-300 text-zinc-900"
                  : "bg-zinc-900 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"
              )}
            >
              {position === 'none' ? '—' : position === 'top-left' ? '↖' : position === 'top-right' ? '↗' : position === 'bottom-left' ? '↙' : '↘'}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* Saved Presets */}
      <div className="space-y-3">
        <SectionLabel>Presets</SectionLabel>
        
        {presets.length > 0 && (
          <div className="space-y-px bg-zinc-800 p-px mb-2">
            {presets.map((preset) => (
              <div key={preset.id} className="flex items-center group">
                <button
                  onClick={() => onLoadPreset(preset)}
                  className="flex-1 py-2 px-3 text-[11px] text-left font-mono text-zinc-500 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 transition-all duration-100 truncate uppercase tracking-wider"
                >
                  {preset.name}
                </button>
                <button
                  onClick={() => onDeletePreset(preset.id)}
                  className="px-2 py-2 text-zinc-700 hover:text-red-400 bg-zinc-900 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all duration-100"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {showSaveInput ? (
          <div className="flex gap-px bg-zinc-800 p-px">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Name..."
              className="flex-1 h-8 bg-zinc-900 border-0 text-[11px] font-mono text-zinc-300 placeholder:text-zinc-700 focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="bg-zinc-300 text-zinc-900 hover:bg-zinc-200 h-8 px-3 rounded-none text-[10px] font-mono uppercase"
            >
              <SaveIcon className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveInput(true)}
            className="w-full py-2 px-3 border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all duration-100 text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <SaveIcon className="w-3 h-3" />
            Save Current
          </button>
        )}
      </div>

      <Divider />

      {/* Export Actions */}
      <div className="space-y-2 pt-2">
        <button
          className="w-full py-3 px-4 bg-zinc-200 text-zinc-900 font-mono text-xs uppercase tracking-wider transition-all duration-100 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          onClick={onExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <DownloadIcon className="w-3.5 h-3.5" />
              Export
            </>
          )}
        </button>
        
        <button
          className="w-full py-2.5 px-4 border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all duration-100 font-mono text-[11px] uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          onClick={onSaveToLibrary}
          disabled={isSavingToLibrary}
        >
          {isSavingToLibrary ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <ArchiveIcon className="w-3 h-3" />
              Library
            </>
          )}
        </button>
      </div>
      
      {/* Bottom decoration */}
      <div className="flex items-center gap-2 pt-4">
        <div className="w-2 h-2 border border-zinc-800" />
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest">v1.0</span>
        <div className="flex-1 h-px bg-zinc-800" />
        <div className="w-2 h-2 border border-zinc-800" />
      </div>
        </div>
      </div>
    </div>
  );
}

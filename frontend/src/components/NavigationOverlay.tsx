import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ApertureIcon,
  ArchiveIcon,
  DisplayIcon,
  CloseIcon,
} from "@/components/icons";

export const navItems = [
  { path: "/shots", label: "Shots", icon: ApertureIcon, description: "Device mockups" },
  { path: "/library", label: "Library", icon: ArchiveIcon, description: "Content assets" },
  { path: "/simulator", label: "Simulator", icon: DisplayIcon, description: "Device preview" },
];

interface NavigationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavigationOverlay({ isOpen, onClose }: NavigationOverlayProps) {
  const [contentVisible, setContentVisible] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setContentVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setContentVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setContentVisible(false);

    setTimeout(() => {
      onClose();
    }, 250);
  };
  
  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100]",
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* Background - Frosted glass effect */}
      <div
        className={cn(
          "absolute inset-0 bg-background/80 backdrop-blur-xl transition-opacity duration-400",
          contentVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Subtle grid overlay */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          contentVisible ? "opacity-100" : "opacity-0"
        )}
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--border) / 0.15) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border) / 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Header bar */}
        <div
          className={cn(
            "border-b border-border/50 transition-all duration-400",
            contentVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          )}
        >
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-[hsl(var(--success))] animate-pulse" />
              <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Control Centre
              </span>
              <div className="h-4 w-px bg-border/50" />
              <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                {navItems.length} Modules
              </span>
            </div>

            <button
              onClick={onClose}
              className={cn(
                "group w-10 h-10 border border-border/50 hover:border-muted-foreground/50 flex items-center justify-center transition-all duration-300 focus-ring hover:bg-muted/20"
              )}
            >
              <CloseIcon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            </button>
          </div>
        </div>

        {/* Main control grid */}
        <div className="flex-1 container mx-auto px-6 py-12 flex items-center justify-center" onClick={onClose}>
          <div
            className={cn(
              "w-full max-w-4xl transition-all duration-500",
              contentVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Module grid */}
            <div className="grid grid-cols-3 gap-3">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                const isHovered = hoveredIndex === index;
                const Icon = item.icon;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={cn(
                      "group relative aspect-square p-4 transition-all duration-100 focus-ring",
                      "border flex flex-col items-center justify-center gap-3",
                      isActive
                        ? "bg-muted/30 border-muted-foreground/40"
                        : "bg-card/30 border-border/50 hover:bg-muted/30 hover:border-muted-foreground/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-muted/20"
                    )}
                    style={{ 
                      transitionDelay: contentVisible ? `${index * 40}ms` : "0ms",
                      opacity: contentVisible ? 1 : 0,
                      transform: contentVisible ? 'translateY(0)' : 'translateY(10px)',
                    }}
                  >
                    {/* Status indicator */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <div 
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isActive ? "bg-[hsl(var(--success))]" : "bg-muted-foreground/30"
                        )}
                      />
                    </div>

                    {/* Index */}
                    <div className="absolute top-3 left-3 font-mono text-[9px] text-muted-foreground/40">
                      0{index + 1}
                    </div>
                    
                    {/* Icon container */}
                    <div
                      className={cn(
                        "w-12 h-12 border flex items-center justify-center transition-all duration-100",
                        isActive
                          ? "border-muted-foreground/50 bg-muted/30"
                          : isHovered
                            ? "border-muted-foreground/50 bg-muted/30 scale-110"
                            : "border-border/60"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 transition-all duration-100",
                          isActive
                            ? "text-foreground"
                            : isHovered
                              ? "text-foreground brightness-125"
                              : "text-muted-foreground"
                        )}
                      />
                    </div>

                    {/* Label */}
                    <div className="text-center">
                      <div
                        className={cn(
                          "font-mono text-[11px] uppercase tracking-wider transition-all duration-100 mb-0.5",
                          isActive
                            ? "text-foreground"
                            : isHovered
                              ? "text-foreground brightness-110"
                              : "text-muted-foreground"
                        )}
                      >
                        {item.label}
                      </div>
                      <div
                        className={cn(
                          "font-mono text-[9px] uppercase tracking-wider transition-all duration-100",
                          isActive
                            ? "text-muted-foreground"
                            : isHovered
                              ? "text-muted-foreground brightness-110"
                              : "text-muted-foreground/50"
                        )}
                      >
                        {item.description}
                      </div>
                    </div>

                    {/* Active border glow */}
                    {isActive && (
                      <div className="absolute inset-0 border border-muted-foreground/20 pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer status bar */}
        <div
          className={cn(
            "border-t border-border/50 transition-all duration-400 delay-200",
            contentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[hsl(var(--success))]" />
                  <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                    System Online
                  </span>
                </div>
                <div className="h-3 w-px bg-border/30" />
                <span className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                  All modules operational
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-3 bg-muted-foreground/20"
                      style={{ height: `${8 + i * 3}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-wider">
                  v1.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for navigation state
export function useNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
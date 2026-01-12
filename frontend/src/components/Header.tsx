import { useState } from "react";
import { useLocation } from "react-router-dom";
import { NavigationOverlay, navItems } from "@/components/NavigationOverlay";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const getPageLabel = () => {
    const item = navItems.find(item => item.path === location.pathname);
    return item && item.path !== "/" ? item.label.toUpperCase() : "";
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm">
            <span
              className="font-bold text-foreground/90 cursor-pointer hover:text-foreground transition-colors duration-200"
              onClick={() => setIsOpen(true)}
            >
              NUMIA
            </span>
            {getPageLabel() && (
              <>
                <span className="text-muted-foreground/40 mx-0.5">/</span>
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  {getPageLabel()}
                </span>
              </>
            )}
          </div>

          {/* Right side status */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <div className="status-online" />
              <span className="font-mono text-2xs text-muted-foreground uppercase tracking-wider">
                Online
              </span>
            </div>
          </div>
        </div>
      </header>

      <NavigationOverlay isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

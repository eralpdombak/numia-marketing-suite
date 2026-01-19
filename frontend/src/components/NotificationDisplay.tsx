import { useNotification } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function NotificationDisplay() {
  const { currentNotification, showNotification } = useNotification();
  const [isVisible, setIsVisible] = useState(false);
  const [displayNotification, setDisplayNotification] = useState(currentNotification);

  // Listen for toast events
  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; type: 'success' | 'error' | 'info' }>;
      showNotification(customEvent.detail.message, customEvent.detail.type);
    };

    window.addEventListener('notification', handleNotification);
    return () => window.removeEventListener('notification', handleNotification);
  }, [showNotification]);

  useEffect(() => {
    if (currentNotification) {
      setDisplayNotification(currentNotification);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentNotification]);

  const styles = {
    success: {
      symbol: '✓',
      text: 'text-zinc-300',
      symbolColor: 'text-zinc-400',
      border: 'border-zinc-800',
      bg: 'bg-zinc-950',
    },
    error: {
      symbol: '×',
      text: 'text-red-300',
      symbolColor: 'text-red-400',
      border: 'border-red-900/50',
      bg: 'bg-zinc-950',
    },
    info: {
      symbol: 'i',
      text: 'text-zinc-400',
      symbolColor: 'text-zinc-500',
      border: 'border-zinc-800',
      bg: 'bg-zinc-950',
    },
  };

  const style = displayNotification ? styles[displayNotification.type] : styles.info;

  return (
    <div className="fixed bottom-6 right-6 z-[100] pointer-events-none">
      <div
        className={cn(
          "transition-all duration-200 ease-out",
          isVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
        )}
      >
        <div
          className={cn(
            "border backdrop-blur-sm pointer-events-auto shadow-lg",
            "flex items-center gap-3 px-4 py-3",
            "min-w-[240px] max-w-[400px]",
            style.border,
            style.bg
          )}
        >
          {/* Terminal-style prefix */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-zinc-700">[</span>
            <span className={cn("font-bold", style.symbolColor)}>{style.symbol}</span>
            <span className="text-zinc-700">]</span>
          </div>

          {/* Message */}
          <p className={cn("font-mono text-xs flex-1", style.text)}>
            {displayNotification?.message}
          </p>
        </div>
      </div>
    </div>
  );
}

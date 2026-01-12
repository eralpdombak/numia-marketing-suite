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
      indicator: 'bg-zinc-200',
      text: 'text-zinc-200',
      border: 'border-zinc-700',
    },
    error: {
      indicator: 'bg-red-400',
      text: 'text-red-400',
      border: 'border-red-900',
    },
    info: {
      indicator: 'bg-zinc-500',
      text: 'text-zinc-400',
      border: 'border-zinc-800',
    },
  };

  const style = displayNotification ? styles[displayNotification.type] : styles.info;

  return (
    <div className="fixed bottom-6 right-6 z-[100] pointer-events-none">
      <div
        className={cn(
          "transition-all duration-200 ease-out",
          isVisible
            ? "translate-x-0 opacity-100"
            : "translate-x-8 opacity-0"
        )}
      >
        <div
          className={cn(
            "bg-zinc-950 border backdrop-blur-sm pointer-events-auto",
            "flex items-center gap-3 px-4 py-3",
            "min-w-[280px] max-w-[400px]",
            style.border
          )}
        >
          {/* Status indicator */}
          <div className={cn("w-1.5 h-1.5", style.indicator)} />

          {/* Message */}
          <p className={cn("font-mono text-xs uppercase tracking-wider flex-1", style.text)}>
            {displayNotification?.message}
          </p>
        </div>
      </div>
    </div>
  );
}

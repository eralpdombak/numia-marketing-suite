import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

export interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  timestamp: number;
}

interface NotificationContextType {
  currentNotification: Notification | null;
  showNotification: (message: string, type: Notification["type"]) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [queue, setQueue] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: Notification["type"]) => {
    const notification: Notification = {
      id: crypto.randomUUID(),
      message,
      type,
      timestamp: Date.now(),
    };

    setQueue(prev => [...prev, notification]);
  }, []);

  // Show next notification from queue
  useEffect(() => {
    if (!currentNotification && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrentNotification(next);
      setQueue(rest);
    }
  }, [currentNotification, queue]);

  // Auto-clear current notification after 3 seconds
  useEffect(() => {
    if (currentNotification) {
      const timer = setTimeout(() => {
        setCurrentNotification(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentNotification]);

  return (
    <NotificationContext.Provider value={{ currentNotification, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}

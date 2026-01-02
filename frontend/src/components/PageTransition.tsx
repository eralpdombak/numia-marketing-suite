import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    setIsAnimating(true);
    
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 20);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      className={cn(
        "transition-all duration-500",
        isAnimating 
          ? "opacity-0 scale-[0.98]" 
          : "opacity-100 scale-100"
      )}
      style={{ 
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transformOrigin: 'center top'
      }}
    >
      {children}
    </div>
  );
}
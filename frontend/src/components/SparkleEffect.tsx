import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Sparkle {
  id: string;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface SparkleEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function SparkleEffect({ trigger, onComplete }: SparkleEffectProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);
      
      // Generate random sparkles
      const newSparkles: Sparkle[] = Array.from({ length: 12 }, (_, i) => ({
        id: `sparkle-${i}-${Date.now()}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 4,
        delay: Math.random() * 0.3,
      }));
      
      setSparkles(newSparkles);
      
      // Clear after animation
      setTimeout(() => {
        setSparkles([]);
        setIsActive(false);
        onComplete?.();
      }, 1000);
    }
  }, [trigger, isActive, onComplete]);

  if (sparkles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute animate-sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animationDelay: `${sparkle.delay}s`,
          }}
        >
          <svg
            width={sparkle.size}
            height={sparkle.size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
          >
            <path
              d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
              fill="currentColor"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

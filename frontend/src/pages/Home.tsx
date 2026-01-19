import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { NavigationOverlay, useNavigation } from "@/components/NavigationOverlay";
import { CompassIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export default function Home() {
  const nav = useNavigation();
  const location = useLocation();
  const [compassState, setCompassState] = useState<
    'idle' | 'start' | 'flying' | 'centered' | 'hidden' | 'returning' | 'landing'
  >('idle');
  const [compassRect, setCompassRect] = useState<DOMRect | null>(null);
  const compassButtonRef = useRef<HTMLButtonElement>(null);
  
  const handleCompassClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCompassRect(rect);
    
    setCompassState('start');
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCompassState('flying');
      });
    });
    
    setTimeout(() => {
      setCompassState('centered');
    }, 450);
    
    setTimeout(() => {
      setCompassState('hidden');
      nav.open();
    }, 650);
  };
  
  useEffect(() => {
    if (!nav.isOpen && compassState === 'hidden') {
      if (compassButtonRef.current) {
        const rect = compassButtonRef.current.getBoundingClientRect();
        setCompassRect(rect);
      }

      setCompassState('returning');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCompassState('landing');
        });
      });

      setTimeout(() => {
        setCompassState('idle');
        setCompassRect(null);
      }, 500);
    }
  }, [nav.isOpen]);

  // Auto-open navigation after login
  useEffect(() => {
    const state = location.state as { autoOpenNav?: boolean };
    if (state?.autoOpenNav && compassButtonRef.current) {
      // Small delay to let the page render
      setTimeout(() => {
        if (compassButtonRef.current) {
          const rect = compassButtonRef.current.getBoundingClientRect();
          setCompassRect(rect);

          setCompassState('start');

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setCompassState('flying');
            });
          });

          setTimeout(() => {
            setCompassState('centered');
          }, 450);

          setTimeout(() => {
            setCompassState('hidden');
            nav.open();
          }, 650);
        }
      }, 100);

      // Clear the state so it doesn't trigger again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const getTransformStyle = (): React.CSSProperties => {
    if (!compassRect) return {};
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const compassCenterX = compassRect.left + compassRect.width / 2;
    const compassCenterY = compassRect.top + compassRect.height / 2;
    
    const translateX = centerX - compassCenterX;
    const translateY = centerY - compassCenterY;
    
    if (compassState === 'start') {
      return {
        transform: 'translate(0, 0) rotate(0deg) scale(1)',
        transition: 'none',
      };
    }
    
    if (compassState === 'flying') {
      return {
        transform: `translate(${translateX}px, ${translateY}px) rotate(270deg) scale(1.15)`,
        transition: 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }
    
    if (compassState === 'centered') {
      return {
        transform: `translate(${translateX}px, ${translateY}px) rotate(360deg) scale(1.2)`,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    }
    
    if (compassState === 'hidden') {
      return {
        transform: `translate(${translateX}px, ${translateY}px) rotate(360deg) scale(0.8)`,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 0,
      };
    }
    
    if (compassState === 'returning') {
      return {
        transform: `translate(${translateX}px, ${translateY}px) rotate(270deg) scale(1.15)`,
        transition: 'none',
        opacity: 1,
      };
    }
    
    if (compassState === 'landing') {
      return {
        transform: 'translate(0, 0) rotate(0deg) scale(1)',
        transition: 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 1,
      };
    }
    
    return {};
  };

  const showBackdrop = compassState !== 'idle' && !nav.isOpen;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, hsl(var(--background)) 100%)',
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />

      <NavigationOverlay isOpen={nav.isOpen} onClose={nav.close} />

      {/* Backdrop during animation */}
      <div
        className={cn(
          "fixed inset-0 z-[150] pointer-events-none transition-all duration-500",
          showBackdrop
            ? "bg-background/60 backdrop-blur-sm"
            : "bg-transparent backdrop-blur-0 opacity-0"
        )}
      />
      
      {/* Flying compass overlay */}
      {compassState !== 'idle' && compassRect && (
        <div 
          className="fixed z-[200] pointer-events-none"
          style={{
            left: compassRect.left,
            top: compassRect.top,
            width: compassRect.width,
            height: compassRect.height,
            ...getTransformStyle(),
          }}
        >
          <div 
            className={cn(
              "absolute inset-0 rounded-full transition-opacity duration-300",
              (compassState === 'flying' || compassState === 'centered' || compassState === 'returning') 
                ? "opacity-100" 
                : "opacity-0"
            )}
            style={{
              background: 'radial-gradient(circle, hsl(var(--foreground) / 0.08) 0%, transparent 70%)',
              transform: 'scale(1.8)',
            }}
          />
          <CompassIcon className="w-full h-full text-foreground relative z-10" />
        </div>
      )}
      
      {/* Main content - just the compass */}
      <main className="min-h-screen flex items-center justify-center relative z-10">
        <button
          ref={compassButtonRef}
          onClick={handleCompassClick}
          disabled={compassState !== 'idle'}
          className={cn(
            "relative group focus-ring",
            "w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56",
            compassState !== 'idle'
              ? "opacity-0 pointer-events-none transition-none"
              : "opacity-100 transition-all duration-500"
          )}
        >
          {/* Compass icon */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-700 group-hover:rotate-45"
            style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <CompassIcon className="w-full h-full text-muted-foreground group-hover:text-white transition-colors duration-300" />
          </div>
        </button>
      </main>
    </div>
  );
}
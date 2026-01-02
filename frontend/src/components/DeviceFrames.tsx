import { cn } from "@/lib/utils";
import { DeviceType } from "@/types/mockup";

interface DeviceFrameProps {
  deviceType: DeviceType;
  deviceColor: 'black' | 'silver';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  imageRadius?: number;
  hasImage?: boolean;
}

export function DeviceFrame({ deviceType, children, className, style, imageRadius = 0, hasImage = false }: DeviceFrameProps) {
  if (deviceType === 'none') {
    return (
      <div className={cn("overflow-hidden", className)}>
        <div 
          className="w-[480px] aspect-video overflow-hidden"
          style={{ borderRadius: imageRadius }}
        >
          {children}
        </div>
      </div>
    );
  }

  // Browser frame
  if (deviceType === 'browser') {
    return (
      <div
        className={cn("w-full max-w-4xl", className)}
        style={{
          transformStyle: 'preserve-3d',
          ...style,
        }}
      >
        <div
          className="rounded-[12px] bg-[#2a2a2e] overflow-hidden"
          style={{
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 10px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Title bar */}
          <div className="h-[32px] flex items-center justify-center px-3 relative">
            <div className="absolute left-3 flex gap-[6px]">
              <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
              <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
              <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
            </div>
            <div className="h-[18px] w-[180px] rounded-md bg-[#1c1c1e] flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground/50 text-center">numia.xyz</span>
            </div>
          </div>

          {/* Browser content */}
          <div className="w-full aspect-[16/10] bg-[#1c1c1e] overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function ApertureIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

export function ArchiveIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <rect x="3" y="4" width="18" height="4" />
      <path d="M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

export function TerminalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <rect x="2" y="4" width="20" height="16" rx="1" />
      <line x1="6" y1="8" x2="6" y2="8.01" strokeWidth="2" />
      <line x1="10" y1="8" x2="10" y2="8.01" strokeWidth="2" />
      <line x1="14" y1="8" x2="14" y2="8.01" strokeWidth="2" />
      <line x1="6" y1="16" x2="10" y2="12" />
      <line x1="10" y1="12" x2="18" y2="12" />
    </svg>
  );
}

export function DisplayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <rect x="2" y="3" width="20" height="14" rx="1" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="6" y1="7" x2="10" y2="7" />
      <line x1="6" y1="10" x2="14" y2="10" />
    </svg>
  );
}

export function CircuitIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="3" x2="12" y2="9" />
      <line x1="12" y1="15" x2="12" y2="21" />
      <line x1="3" y1="12" x2="9" y2="12" />
      <line x1="15" y1="12" x2="21" y2="12" />
      <circle cx="12" cy="3" r="1" fill="currentColor" />
      <circle cx="12" cy="21" r="1" fill="currentColor" />
      <circle cx="3" cy="12" r="1" fill="currentColor" />
      <circle cx="21" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function DatabaseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 5v14c0 1.657-4.03 3-9 3s-9-1.343-9-3V5" />
      <path d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3" />
    </svg>
  );
}

export function CompassIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={cn("w-5 h-5", className)}>
      {/* Outer circle */}
      <circle cx="12" cy="12" r="11" strokeWidth="0.6" opacity="1" />

      {/* Inner circle */}
      <circle cx="12" cy="12" r="7" strokeWidth="0.35" strokeOpacity="0.7" />

      {/* Cardinal direction lines - outside outer circle only, no overlap */}
      <line x1="12" y1="0" x2="12" y2="1" strokeWidth="0.6" opacity="1" />
      <line x1="12" y1="23" x2="12" y2="24" strokeWidth="0.6" opacity="1" />
      <line x1="0" y1="12" x2="1" y2="12" strokeWidth="0.6" opacity="1" />
      <line x1="23" y1="12" x2="24" y2="12" strokeWidth="0.6" opacity="1" />

      {/* NUMIA text */}
      <text
        x="12"
        y="12.5"
        textAnchor="middle"
        fontSize="2.5"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        fill="currentColor"
        stroke="none"
        letterSpacing="0.1"
      >
        NUMIA
      </text>
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function FileIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  );
}

export function ImageIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <path d="M4 6h16" />
      <path d="M10 6V4h4v2" />
      <path d="M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6" />
      <line x1="10" y1="10" x2="10" y2="16" />
      <line x1="14" y1="10" x2="14" y2="16" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
  );
}

export function ExpandIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <rect x="9" y="9" width="13" height="13" rx="1" />
      <path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("w-5 h-5", className)}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function SortIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <path d="M3 6h18" />
      <path d="M6 12h12" />
      <path d="M9 18h6" />
    </svg>
  );
}

export function LinkedInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="8" y1="11" x2="8" y2="16" />
      <line x1="8" y1="8" x2="8" y2="8.01" strokeWidth="2" />
      <path d="M12 16v-5" />
      <path d="M16 16v-3a2 2 0 00-4 0" />
    </svg>
  );
}

export function TwitterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <path d="M4 4l11.733 16h4.267l-11.733-16z" />
      <path d="M4 20l6.4-8" />
      <path d="M20 4l-6.4 8" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

export function LoaderIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5 animate-spin", className)}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" />
    </svg>
  );
}

export function CheckboxIcon({ className, checked }: IconProps & { checked?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <rect x="3" y="3" width="18" height="18" rx="2" fill={checked ? "currentColor" : "none"} />
      {checked && <path d="M9 12l2 2 4-4" stroke="hsl(var(--background))" strokeWidth="2" />}
    </svg>
  );
}

export function NotesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  );
}

export function BrainIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("w-5 h-5", className)}>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <line x1="12" y1="4" x2="12" y2="10" />
      <line x1="12" y1="14" x2="12" y2="20" />
      <line x1="4" y1="12" x2="10" y2="12" />
      <line x1="14" y1="12" x2="20" y2="12" />
      <circle cx="12" cy="4" r="1" fill="currentColor" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="20" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CompassIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

export default function Login() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const success = login(code);
    if (success) {
      navigate('/', { state: { autoOpenNav: true } });
    } else {
      setError(true);
      setIsShaking(true);
      setCode('');

      setTimeout(() => {
        setIsShaking(false);
      }, 500);

      setTimeout(() => {
        setError(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Subtle grid overlay */}
      <div
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--border) / 0.15) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border) / 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Compass icon */}
        <div className="flex justify-center mb-8">
          <CompassIcon className="w-24 h-24 text-foreground" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-mono text-sm uppercase tracking-[0.3em] text-foreground mb-2">
            Access Required
          </h1>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            Enter your access code
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className={cn(
              "transition-transform duration-300 ease-out",
              isShaking && "animate-shake"
            )}
          >
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder=""
              autoFocus
              className={cn(
                "w-full px-6 py-4 bg-background border text-center",
                "font-mono text-lg tracking-widest uppercase",
                "focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all",
                error
                  ? "border-red-500/50 text-red-500"
                  : "border-border/50 text-foreground hover:border-muted-foreground/30"
              )}
            />

            {error && (
              <p className="mt-2 text-center font-mono text-xs text-red-500 uppercase tracking-wider">
                Invalid access code
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!code.trim()}
            className={cn(
              "w-full py-4 border font-mono text-xs uppercase tracking-wider transition-all",
              "focus:outline-none focus:ring-2 focus:ring-foreground/20",
              code.trim()
                ? "bg-foreground text-background hover:bg-foreground/90 border-foreground"
                : "bg-transparent text-muted-foreground/50 border-border/50 cursor-not-allowed"
            )}
          >
            Enter
          </button>
        </form>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-muted-foreground/30" />
            <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Numia Internal Tool
            </span>
            <div className="w-1.5 h-1.5 bg-muted-foreground/30" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

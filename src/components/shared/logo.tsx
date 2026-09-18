export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
        <circle cx="16" cy="16" r="2.5" fill="hsl(var(--primary))" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI) / 4;
          const x2 = 16 + 13 * Math.cos(angle);
          const y2 = 16 + 13 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={16 + 3 * Math.cos(angle)}
              y1={16 + 3 * Math.sin(angle)}
              x2={x2}
              y2={y2}
              stroke="hsl(var(--secondary))"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
      <span className="font-display text-lg font-bold leading-none">
        NSS <span className="text-secondary">Connect</span>
      </span>
    </div>
  );
}

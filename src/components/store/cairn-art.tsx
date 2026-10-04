import { cn } from "@/lib/utils";

/** The three stacked stones, drawn inline so it costs no extra download. */
export function CairnStones({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d="M10 51c0-4.8 9.6-8 22-8s22 3.2 22 8-9.6 7-22 7S10 55.8 10 51Z" />
      <path d="M18 34.5c0-3.9 6.7-6 15-6s15 2.1 15 6-6.7 6-15 6-15-2.1-15-6Z" />
      <path d="M20.5 21.5c0-3.2 4.3-5 9.5-5s9.5 1.8 9.5 5-4.3 5-9.5 5-9.5-1.8-9.5-5Z" />
    </svg>
  );
}

/** A faint dotted path that ends at a small cairn: decoration only. */
export function TrailLine({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 160"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none", className)}
    >
      <path
        d="M4 140c60-6 92-40 150-44s84 30 140 22 76-58 120-74"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 10"
      />
      <g fill="currentColor" transform="translate(420 6) scale(0.7)">
        <path d="M10 51c0-4.8 9.6-8 22-8s22 3.2 22 8-9.6 7-22 7S10 55.8 10 51Z" />
        <path d="M18 34.5c0-3.9 6.7-6 15-6s15 2.1 15 6-6.7 6-15 6-15-2.1-15-6Z" />
        <path d="M20.5 21.5c0-3.2 4.3-5 9.5-5s9.5 1.8 9.5 5-4.3 5-9.5 5-9.5-1.8-9.5-5Z" />
      </g>
    </svg>
  );
}

"use client";

export default function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span
      aria-label="A carregar"
      className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-brand-primary ${className}`}
      role="status"
    />
  );
}

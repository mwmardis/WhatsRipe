import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 text-center min-h-[70vh]">
      {/* Decorative illustration */}
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-muted">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 15h0" />
            <path d="M16 15h0" />
            <path d="M9.5 9 8 10" />
            <path d="M14.5 9 16 10" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-6xl font-bold text-primary/40">404</h1>
        <p className="text-lg text-muted-foreground">
          This page wandered off the garden path
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:bg-primary/90"
      >
        Back to the Garden
      </Link>
    </div>
  );
}

"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h2 className="text-2xl font-bold text-ll-on-surface font-ll-display">
        Something went wrong
      </h2>
      <p className="max-w-md text-ll-on-surface-muted">
        An unexpected error occurred. You can try again or return to the home
        page.
      </p>
      {error.digest && (
        <p className="text-xs text-ll-on-surface-muted">
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="rounded-[var(--ll-radius-md)] bg-ll-primary px-6 py-2 font-medium text-ll-on-primary transition-colors hover:bg-ll-primary-hover"
      >
        Try again
      </button>
    </div>
  );
}

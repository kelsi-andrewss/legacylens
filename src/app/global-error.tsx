"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F5F0E8",
          color: "#1A1208",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#6B5D45", marginBottom: "0.5rem" }}>
            A critical error occurred. Please try again.
          </p>
          {error.digest && (
            <p style={{ color: "#6B5D45", fontSize: "0.75rem", marginBottom: "1.5rem" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              backgroundColor: "#C2410C",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "4px",
              padding: "0.5rem 1.5rem",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

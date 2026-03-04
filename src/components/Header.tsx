"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Gamepad2 } from "lucide-react";

const navLinks = [
  { href: "/", label: "Explore", icon: Compass },
  { href: "/play", label: "Play", icon: Gamepad2 },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="theme-header border-b border-ll-outline bg-ll-surface-variant">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <Link href="/" className="text-2xl font-bold text-ll-on-surface">
            LegacyLens
          </Link>
          <p className="mt-0.5 text-sm text-ll-on-surface-muted">
            RAG-powered LAPACK/BLAS explorer
          </p>
        </div>
        <nav className="flex gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-ll-primary-container text-ll-on-primary-container"
                    : "text-ll-on-surface-muted hover:bg-ll-surface-tonal"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

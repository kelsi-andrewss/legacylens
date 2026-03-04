const POKEDEX_KEY = "ll-pokedex";
const XP_KEY = "ll-xp";
const LAST_VIEWED_KEY = "ll-pokedex-last-viewed";
const META_KEY = "ll-pokedex-meta";

function readSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(POKEDEX_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(set: Set<string>): void {
  localStorage.setItem(POKEDEX_KEY, JSON.stringify([...set]));
}

export function isDiscovered(name: string): boolean {
  return readSet().has(name);
}

export function markDiscovered(name: string): void {
  const set = readSet();
  set.add(name);
  writeSet(set);
}

export function getDiscoveredSet(): Set<string> {
  return readSet();
}

export function getXP(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(XP_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function addXP(amount: number): void {
  const current = getXP();
  localStorage.setItem(XP_KEY, String(current + amount));
}

export function getStats(): { discovered: number; total: number; xp: number } {
  const discovered = readSet().size;
  return { discovered, total: discovered, xp: getXP() };
}

export function getLastViewedAt(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(LAST_VIEWED_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function markAllAsSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_VIEWED_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function hasUnseenDiscoveries(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return false;
    const entries = JSON.parse(raw) as Array<{ discoveredAt?: number }>;
    const lastViewed = getLastViewedAt();
    return entries.some((e) => e.discoveredAt !== undefined && e.discoveredAt > lastViewed);
  } catch {
    return false;
  }
}

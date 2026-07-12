import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CollectionStatus } from "./types";

// Phase 1 collection store: a map of squishyId -> { status, addedAt },
// persisted to localStorage on web. When the iOS build lands, swap the
// storage shim for AsyncStorage — the context API stays identical.

interface StoredEntry {
  status: CollectionStatus;
  addedAt: string;
}

type Entries = Record<string, StoredEntry>;

const STORAGE_KEY = "squishydex.collection.v1";

const storage = {
  load(): Entries {
    try {
      if (typeof localStorage === "undefined") return {};
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Entries) : {};
    } catch {
      return {};
    }
  },
  save(entries: Entries) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Non-fatal: collection just won't persist this session.
    }
  },
};

interface CollectionContextValue {
  entries: Entries;
  statusOf(squishyId: string): CollectionStatus | null;
  toggle(squishyId: string, status: CollectionStatus): void;
  idsWithStatus(status: CollectionStatus): string[];
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entries>(() => storage.load());

  useEffect(() => {
    storage.save(entries);
  }, [entries]);

  const statusOf = useCallback(
    (squishyId: string) => entries[squishyId]?.status ?? null,
    [entries]
  );

  // Toggling the current status removes the entry; setting the other status
  // moves it (an item is either owned or wished, never both).
  const toggle = useCallback((squishyId: string, status: CollectionStatus) => {
    setEntries((prev) => {
      const next = { ...prev };
      if (next[squishyId]?.status === status) {
        delete next[squishyId];
      } else {
        next[squishyId] = { status, addedAt: new Date().toISOString() };
      }
      return next;
    });
  }, []);

  const idsWithStatus = useCallback(
    (status: CollectionStatus) =>
      Object.entries(entries)
        .filter(([, e]) => e.status === status)
        .sort(([, a], [, b]) => b.addedAt.localeCompare(a.addedAt))
        .map(([id]) => id),
    [entries]
  );

  const value = useMemo(
    () => ({ entries, statusOf, toggle, idsWithStatus }),
    [entries, statusOf, toggle, idsWithStatus]
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollection(): CollectionContextValue {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error("useCollection must be used inside CollectionProvider");
  return ctx;
}

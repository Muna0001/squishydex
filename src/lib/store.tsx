import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./auth";
import { supabase } from "./supabase";
import type { CollectionStatus } from "./types";

// Collection store. Two backends behind one context API:
//   signed out → localStorage (pre-account behavior, unchanged)
//   signed in  → Supabase user_collection_entries, optimistic updates
// On first login any local entries migrate to the account (server wins
// on conflict), then local storage is cleared so there's one source of
// truth per mode.

interface StoredEntry {
  status: CollectionStatus;
  addedAt: string;
  quantity?: number; // copies owned; undefined = 1 (pre-quantity entries)
}

type Entries = Record<string, StoredEntry>;

const STORAGE_KEY = "squishydex.collection.v1";

const localStore = {
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
  clear() {
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};

interface CollectionContextValue {
  entries: Entries;
  /** True while the signed-in collection is first loading from the server. */
  syncing: boolean;
  statusOf(squishyId: string): CollectionStatus | null;
  toggle(squishyId: string, status: CollectionStatus): void;
  idsWithStatus(status: CollectionStatus): string[];
  quantityOf(squishyId: string): number;
  /** Set copies owned; qty 0 removes the entry entirely. */
  setQuantity(squishyId: string, qty: number): void;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entries>(() => localStore.load());
  const [syncing, setSyncing] = useState(false);
  // Which mode the current `entries` belong to, so we never write one
  // mode's state into the other's storage.
  const modeRef = useRef<"local" | string>("local");

  // Persist to localStorage only in local mode.
  useEffect(() => {
    if (modeRef.current === "local") localStore.save(entries);
  }, [entries]);

  // Switch backends when auth state changes.
  useEffect(() => {
    let cancelled = false;

    async function loadAccount(userId: string) {
      if (!supabase) return;
      setSyncing(true);

      // One-time migration: push pre-account local entries up, server wins.
      const local = localStore.load();
      const localIds = Object.keys(local);
      if (localIds.length > 0) {
        const rows = localIds.map((squishyId) => ({
          user_id: userId,
          squishy_id: squishyId,
          status: local[squishyId].status,
          added_at: local[squishyId].addedAt,
          quantity: local[squishyId].quantity ?? 1,
        }));
        const { error } = await supabase
          .from("user_collection_entries")
          .upsert(rows, { onConflict: "user_id,squishy_id", ignoreDuplicates: true });
        if (!error) localStore.clear();
        // On error we leave local data intact and retry next sign-in.
      }

      const { data, error } = await supabase
        .from("user_collection_entries")
        .select("squishy_id, status, added_at, quantity")
        .eq("user_id", userId);
      if (cancelled) return;
      if (!error && data) {
        const next: Entries = {};
        for (const row of data) {
          next[row.squishy_id] = {
            status: row.status,
            addedAt: row.added_at,
            quantity: row.quantity ?? 1,
          };
        }
        modeRef.current = userId;
        setEntries(next);
      }
      setSyncing(false);
    }

    if (user) {
      loadAccount(user.id);
    } else {
      modeRef.current = "local";
      setEntries(localStore.load());
      setSyncing(false);
    }
    return () => {
      cancelled = true;
    };
  }, [user]);

  const statusOf = useCallback(
    (squishyId: string) => entries[squishyId]?.status ?? null,
    [entries]
  );

  // Toggling the current status removes the entry; setting the other status
  // moves it (an item is either owned or wished, never both).
  const toggle = useCallback(
    (squishyId: string, status: CollectionStatus) => {
      const removing = entries[squishyId]?.status === status;
      const prev = entries;
      const next = { ...entries };
      if (removing) {
        delete next[squishyId];
      } else {
        next[squishyId] = { status, addedAt: new Date().toISOString(), quantity: 1 };
      }
      setEntries(next);

      if (user && supabase) {
        const op = removing
          ? supabase
              .from("user_collection_entries")
              .delete()
              .eq("user_id", user.id)
              .eq("squishy_id", squishyId)
          : supabase
              .from("user_collection_entries")
              .upsert(
                {
                  user_id: user.id,
                  squishy_id: squishyId,
                  status,
                  added_at: next[squishyId].addedAt,
                  quantity: 1,
                },
                { onConflict: "user_id,squishy_id" }
              );
        op.then(({ error }) => {
          if (error) {
            console.warn("Collection sync failed:", error.message);
            setEntries(prev); // revert the optimistic update
          }
        });
      }
    },
    [entries, user]
  );

  const quantityOf = useCallback(
    (squishyId: string) => entries[squishyId]?.quantity ?? 1,
    [entries]
  );

  const setQuantity = useCallback(
    (squishyId: string, qty: number) => {
      const entry = entries[squishyId];
      if (!entry || entry.status !== "owned") return;
      const prev = entries;
      const next = { ...entries };
      if (qty < 1) {
        delete next[squishyId];
      } else {
        next[squishyId] = { ...entry, quantity: qty };
      }
      setEntries(next);

      if (user && supabase) {
        const op =
          qty < 1
            ? supabase
                .from("user_collection_entries")
                .delete()
                .eq("user_id", user.id)
                .eq("squishy_id", squishyId)
            : supabase
                .from("user_collection_entries")
                .update({ quantity: qty })
                .eq("user_id", user.id)
                .eq("squishy_id", squishyId);
        op.then(({ error }) => {
          if (error) {
            console.warn("Quantity sync failed:", error.message);
            setEntries(prev);
          }
        });
      }
    },
    [entries, user]
  );

  const idsWithStatus = useCallback(
    (status: CollectionStatus) =>
      Object.entries(entries)
        .filter(([, e]) => e.status === status)
        .sort(([, a], [, b]) => b.addedAt.localeCompare(a.addedAt))
        .map(([id]) => id),
    [entries]
  );

  const value = useMemo(
    () => ({ entries, syncing, statusOf, toggle, idsWithStatus, quantityOf, setQuantity }),
    [entries, syncing, statusOf, toggle, idsWithStatus, quantityOf, setQuantity]
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollection(): CollectionContextValue {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error("useCollection must be used inside CollectionProvider");
  return ctx;
}

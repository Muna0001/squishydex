import { useMemo } from "react";
import { matchesSquishy, squishies } from "@/data";
import { useSubmissions } from "./submissions";
import type { SearchFilters } from "@/data";
import type { Squishy } from "./types";

// The full browsable catalog: static seed + shop imports + published
// user submissions. Screens that show or resolve squishies use this
// hook so submitted items behave exactly like catalog ones.

export interface Catalog {
  all: Squishy[];
  resolve(id: string): Squishy | undefined;
  search(query: string, filters?: SearchFilters): Squishy[];
  newest(limit: number): Squishy[];
}

export function useCatalog(): Catalog {
  const { submitted } = useSubmissions();
  return useMemo(() => {
    const all = [...squishies, ...submitted];
    const byId = new Map(all.map((s) => [s.id, s]));
    return {
      all,
      resolve: (id: string) => byId.get(id),
      search: (query: string, filters?: SearchFilters) =>
        all.filter((s) => matchesSquishy(s, query, filters)),
      newest: (limit: number) =>
        [...all].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)).slice(0, limit),
    };
  }, [submitted]);
}

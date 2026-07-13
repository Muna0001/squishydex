import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import type { Squishy, SquishySize, SquishyType } from "./types";

// Crowdsourced submissions. Published rows are folded into the browsable
// catalog as Squishy objects (id = the row's uuid). Auto-publish with a
// flag action — no review queue until spam earns one.

export interface SubmittedMeta {
  submittedById: string;
  submittedByName: string;
  status: "published" | "flagged";
}

export interface SubmissionInput {
  name: string;
  brandId: string | null; // existing brand id, or null when newBrandName is set
  newBrandName: string | null;
  type: SquishyType;
  size: SquishySize;
  scent?: string;
  barcode?: string;
  photoBlob: Blob;
  photoExt: string;
}

interface SubmissionsContextValue {
  submitted: Squishy[];
  metaById: Map<string, SubmittedMeta>;
  refresh(): Promise<void>;
  submit(input: SubmissionInput, userId: string): Promise<string>;
  flag(id: string): Promise<void>;
}

const SubmissionsContext = createContext<SubmissionsContextValue | null>(null);

function rowToSquishy(row: any): Squishy {
  return {
    id: row.id,
    name: row.name,
    brandId: row.brand_id || "",
    brandLabel: row.new_brand_name ?? undefined,
    type: row.type,
    size: row.size,
    scent: row.scent ?? undefined,
    imageUrl: row.photo_url,
    barcode: row.barcode ?? undefined,
    dateAdded: (row.submitted_at ?? "").slice(0, 10),
  };
}

export function SubmissionsProvider({ children }: { children: React.ReactNode }) {
  const [rows, setRows] = useState<any[]>([]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("user_submitted_squishies")
      .select("*, submitter:profiles!user_submitted_squishies_submitted_by_fkey (display_name)")
      .eq("status", "published")
      .order("submitted_at", { ascending: false });
    if (!error && data) setRows(data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = useCallback(
    async (input: SubmissionInput, userId: string): Promise<string> => {
      if (!supabase) throw new Error("Accounts aren't set up yet.");

      const path = `${userId}/${Date.now()}.${input.photoExt}`;
      const { error: uploadError } = await supabase.storage
        .from("submission-photos")
        .upload(path, input.photoBlob, { contentType: input.photoBlob.type || "image/jpeg" });
      if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
      const { data: urlData } = supabase.storage.from("submission-photos").getPublicUrl(path);

      const { data, error } = await supabase
        .from("user_submitted_squishies")
        .insert({
          submitted_by: userId,
          name: input.name.trim(),
          brand_id: input.brandId ?? "",
          new_brand_name: input.newBrandName?.trim() || null,
          type: input.type,
          size: input.size,
          scent: input.scent?.trim() || null,
          barcode: input.barcode?.trim() || null,
          photo_url: urlData.publicUrl,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      await refresh();
      return data.id as string;
    },
    [refresh]
  );

  const flag = useCallback(
    async (id: string) => {
      if (!supabase) throw new Error("Not configured.");
      const { error } = await supabase
        .from("user_submitted_squishies")
        .update({ status: "flagged" })
        .eq("id", id);
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh]
  );

  const value = useMemo(() => {
    const submitted = rows.map(rowToSquishy);
    const metaById = new Map<string, SubmittedMeta>(
      rows.map((r) => [
        r.id,
        {
          submittedById: r.submitted_by,
          submittedByName: r.submitter?.display_name || "a collector",
          status: r.status,
        },
      ])
    );
    return { submitted, metaById, refresh, submit, flag };
  }, [rows, refresh, submit, flag]);

  return <SubmissionsContext.Provider value={value}>{children}</SubmissionsContext.Provider>;
}

export function useSubmissions(): SubmissionsContextValue {
  const ctx = useContext(SubmissionsContext);
  if (!ctx) throw new Error("useSubmissions must be used inside SubmissionsProvider");
  return ctx;
}

import { supabase } from "./supabase";
import type { CollectionStatus } from "./types";

// Friends data access. All functions require a signed-in session (RLS
// enforces it server-side regardless). Mutual model: request → accept.

export interface FriendProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
}

export interface FriendshipView {
  id: string;
  status: "pending" | "accepted";
  /** The other person in the friendship. */
  profile: FriendProfile;
  /** True when the signed-in user sent the request. */
  outgoing: boolean;
}

function mapProfile(row: any): FriendProfile {
  return {
    id: row.id,
    displayName: row.display_name || "Collector",
    avatarUrl: row.avatar_url ?? undefined,
    email: row.email ?? undefined,
  };
}

// Search by partial display name or exact email. Excludes yourself.
export async function searchProfiles(query: string, selfId: string): Promise<FriendProfile[]> {
  if (!supabase) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, email")
    .or(`display_name.ilike.%${q}%,email.eq.${q.toLowerCase()}`)
    .neq("id", selfId)
    .limit(10);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProfile);
}

export async function listFriendships(selfId: string): Promise<FriendshipView[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("friendships")
    .select(
      `id, status, requester_id, addressee_id,
       requester:profiles!friendships_requester_id_fkey (id, display_name, avatar_url, email),
       addressee:profiles!friendships_addressee_id_fkey (id, display_name, avatar_url, email)`
    );
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => {
    const outgoing = row.requester_id === selfId;
    return {
      id: row.id,
      status: row.status,
      outgoing,
      profile: mapProfile(outgoing ? row.addressee : row.requester),
    };
  });
}

export async function sendFriendRequest(selfId: string, addresseeId: string): Promise<void> {
  if (!supabase) throw new Error("Not configured.");
  const { error } = await supabase
    .from("friendships")
    .insert({ requester_id: selfId, addressee_id: addresseeId, status: "pending" });
  if (error) {
    if (error.code === "23505") throw new Error("There's already a request between you two.");
    throw new Error(error.message);
  }
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  if (!supabase) throw new Error("Not configured.");
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId);
  if (error) throw new Error(error.message);
}

// Decline an incoming request, cancel an outgoing one, or unfriend.
export async function removeFriendship(friendshipId: string): Promise<void> {
  if (!supabase) throw new Error("Not configured.");
  const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
  if (error) throw new Error(error.message);
}

export interface FriendEntry {
  squishyId: string;
  status: CollectionStatus;
  addedAt: string;
}

// Readable thanks to the "friend entries: select" RLS policy.
export async function fetchFriendEntries(friendId: string): Promise<FriendEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("user_collection_entries")
    .select("squishy_id, status, added_at")
    .eq("user_id", friendId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    squishyId: r.squishy_id,
    status: r.status,
    addedAt: r.added_at,
  }));
}

export function avatarEmojiOf(profile: FriendProfile): string {
  return profile.avatarUrl?.startsWith("emoji:") ? profile.avatarUrl.slice(6) : "🧸";
}

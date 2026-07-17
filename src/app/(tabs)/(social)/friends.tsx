import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Note } from "@/components/form";
import { useAuth } from "@/lib/auth";
import {
  acceptFriendRequest,
  avatarEmojiOf,
  listFriendships,
  removeFriendship,
  searchProfiles,
  sendFriendRequest,
  type FriendProfile,
  type FriendshipView,
} from "@/lib/friends";
import { colors, MAX_CONTENT_WIDTH, radius } from "@/lib/theme";

// Friends tab. Hero action: find a friend. Below it, anything that
// needs a decision (incoming requests), then the list itself.

export default function FriendsScreen() {
  const { user, configured, loading } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Friends</Text>
        {!configured || loading ? (
          loading ? <ActivityIndicator style={{ marginTop: 48 }} color={colors.muted} /> : null
        ) : !user ? (
          <View style={styles.signInCard}>
            <Text style={styles.signInTitle}>Sign in to add friends</Text>
            <Text style={styles.body}>
              Friends are mutual — you each approve the other before collections are shared.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/account")}
              style={({ pressed }) => [styles.cta, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.ctaText}>Go to Account</Text>
            </Pressable>
          </View>
        ) : (
          <FriendsBody selfId={user.id} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FriendsBody({ selfId }: { selfId: string }) {
  const [friendships, setFriendships] = useState<FriendshipView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    listFriendships(selfId)
      .then(setFriendships)
      .catch((e) => setError(e.message));
  }, [selfId]);

  useEffect(reload, [reload]);

  const incoming = (friendships ?? []).filter((f) => f.status === "pending" && !f.outgoing);
  const outgoing = (friendships ?? []).filter((f) => f.status === "pending" && f.outgoing);
  const friends = (friendships ?? []).filter((f) => f.status === "accepted");

  return (
    <View style={{ gap: 20 }}>
      <FriendSearch selfId={selfId} friendships={friendships ?? []} onChanged={reload} />
      {error && <Note kind="error">{error}</Note>}

      {friendships === null ? (
        <ActivityIndicator color={colors.muted} />
      ) : (
        <>
          {incoming.length > 0 && (
            <Section title={`Requests (${incoming.length})`}>
              {incoming.map((f) => (
                <PersonRow key={f.id} profile={f.profile}>
                  <SmallButton
                    label="Accept"
                    tone="primary"
                    onPress={() => acceptFriendRequest(f.id).then(reload).catch((e) => setError(e.message))}
                  />
                  <SmallButton
                    label="Decline"
                    onPress={() => removeFriendship(f.id).then(reload).catch((e) => setError(e.message))}
                  />
                </PersonRow>
              ))}
            </Section>
          )}

          <Section title={friends.length > 0 ? `My friends (${friends.length})` : "My friends"}>
            {friends.length === 0 ? (
              <Text style={styles.body}>
                No friends yet — search above by display name or exact email.
              </Text>
            ) : (
              friends.map((f) => <FriendRow key={f.id} friendship={f} onChanged={reload} />)
            )}
          </Section>

          {outgoing.length > 0 && (
            <Section title="Sent requests">
              {outgoing.map((f) => (
                <PersonRow key={f.id} profile={f.profile} subtitle="Waiting for them to accept">
                  <SmallButton
                    label="Cancel"
                    onPress={() => removeFriendship(f.id).then(reload).catch((e) => setError(e.message))}
                  />
                </PersonRow>
              ))}
            </Section>
          )}
        </>
      )}
    </View>
  );
}

function FriendSearch({
  selfId,
  friendships,
  onChanged,
}: {
  selfId: string;
  friendships: FriendshipView[];
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendProfile[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setBusy(true);
    setError(null);
    try {
      setResults(await searchProfiles(query, selfId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  }

  function statusFor(profileId: string): string | null {
    const f = friendships.find((x) => x.profile.id === profileId);
    if (!f) return null;
    if (f.status === "accepted") return "Friends";
    return f.outgoing ? "Requested" : "Check requests";
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Find by name or exact email…"
          placeholderTextColor={colors.faint}
          style={styles.search}
          accessibilityLabel="Search for friends"
          autoCapitalize="none"
          onSubmitEditing={search}
        />
        <Pressable
          accessibilityRole="button"
          onPress={search}
          disabled={busy || query.trim().length < 2}
          style={({ pressed }) => [
            styles.searchButton,
            (busy || query.trim().length < 2) && { opacity: 0.5 },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.searchButtonText}>{busy ? "…" : "Search"}</Text>
        </Pressable>
      </View>
      {error && <Note kind="error">{error}</Note>}
      {results !== null && (
        <View style={{ gap: 8 }}>
          {results.length === 0 ? (
            <Text style={styles.body}>Nobody found — try their exact email.</Text>
          ) : (
            results.map((p) => {
              const status = statusFor(p.id);
              return (
                <PersonRow key={p.id} profile={p}>
                  {status ? (
                    <Text style={styles.statusText}>{status}</Text>
                  ) : (
                    <SmallButton
                      label="Add friend"
                      tone="primary"
                      onPress={() =>
                        sendFriendRequest(selfId, p.id)
                          .then(onChanged)
                          .catch((e) => setError(e.message))
                      }
                    />
                  )}
                </PersonRow>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

function FriendRow({ friendship, onChanged }: { friendship: FriendshipView; onChanged: () => void }) {
  const router = useRouter();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const p = friendship.profile;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`View ${p.displayName}'s collection`}
      onPress={() => router.push(`/friend/${p.id}?name=${encodeURIComponent(p.displayName)}`)}
      style={({ pressed }) => [styles.personRow, pressed && { opacity: 0.8 }]}
    >
      <Text style={styles.personEmoji}>{avatarEmojiOf(p)}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.personName}>{p.displayName}</Text>
        <Text style={styles.personSub}>Tap to see their collection</Text>
      </View>
      {confirmRemove ? (
        <SmallButton
          label="Confirm remove"
          tone="danger"
          onPress={() => removeFriendship(friendship.id).then(onChanged)}
        />
      ) : (
        <SmallButton label="Remove" onPress={() => setConfirmRemove(true)} />
      )}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PersonRow({
  profile,
  subtitle,
  children,
}: {
  profile: FriendProfile;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.personRow}>
      <Text style={styles.personEmoji}>{avatarEmojiOf(profile)}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.personName}>{profile.displayName}</Text>
        {subtitle ? <Text style={styles.personSub}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function SmallButton({
  label,
  onPress,
  tone = "neutral",
}: {
  label: string;
  onPress: () => void;
  tone?: "neutral" | "primary" | "danger";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.smallButton,
        tone === "primary" && { backgroundColor: colors.ink },
        tone === "danger" && { backgroundColor: colors.wish },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text
        style={[
          styles.smallButtonText,
          tone !== "neutral" && { color: "#FFFFFF" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    width: "100%",
    maxWidth: Math.min(560, MAX_CONTENT_WIDTH),
    alignSelf: "center",
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    paddingTop: 8,
  },
  body: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  signInCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 16,
    gap: 10,
    alignItems: "flex-start",
  },
  signInTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  cta: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
  },
  search: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 11,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.ink,
  },
  searchButton: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  personEmoji: {
    fontSize: 26,
  },
  personName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  personSub: {
    fontSize: 12,
    color: colors.faint,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  smallButton: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginLeft: 6,
  },
  smallButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
});

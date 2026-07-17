import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Chip } from "@/components/chip";
import { Field, LinkText, Note, PrimaryButton } from "@/components/form";
import { brandLabelOf, brands, formatLabel } from "@/data";
import { useAuth } from "@/lib/auth";
import { useCatalog } from "@/lib/catalog";
import { useSubmissions } from "@/lib/submissions";
import { colors, MAX_CONTENT_WIDTH, radius } from "@/lib/theme";
import type { Squishy, SquishySize, SquishyType } from "@/lib/types";

// "Add a product" — the crowdsourcing flow. Photo is the one hard
// requirement (there's no official image for these by definition).
// Fields appear in the order a collector can answer them fastest.

const TYPES: SquishyType[] = [
  "slow-rise-foam",
  "gel-silicone",
  "water-filled",
  "sand-filled",
  "beaded",
  "blind-bag",
  "plush",
];
const SIZES: SquishySize[] = ["micro", "mini", "regular", "jumbo"];

export default function SubmitScreen() {
  const { barcode: scannedBarcode } = useLocalSearchParams<{ barcode?: string }>();
  const router = useRouter();
  const { user, configured } = useAuth();
  const catalog = useCatalog();
  const { submit } = useSubmissions();

  const [photo, setPhoto] = useState<{ uri: string; ext: string } | null>(null);
  const [name, setName] = useState("");
  const [brandQuery, setBrandQuery] = useState("");
  const [brandId, setBrandId] = useState<string | null>(null);
  const [newBrand, setNewBrand] = useState<string | null>(null);
  const [type, setType] = useState<SquishyType | null>(null);
  const [size, setSize] = useState<SquishySize | null>(null);
  const [scent, setScent] = useState("");
  const [barcode, setBarcode] = useState(scannedBarcode ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [possibleDupes, setPossibleDupes] = useState<Squishy[] | null>(null);

  const brandMatches = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q || brandId || newBrand) return [];
    return brands.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 6);
  }, [brandQuery, brandId, newBrand]);

  const brandLabel = newBrand ?? (brandId ? brands.find((b) => b.id === brandId)?.name : null);
  const ready = photo && name.trim().length >= 2 && (brandId || newBrand) && type && size;

  async function pickPhoto() {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.mimeType?.split("/")[1] ?? "jpg";
      setPhoto({ uri: asset.uri, ext });
    }
  }

  // Simple name+brand similarity — surface "might already exist", never block.
  function findDupes(): Squishy[] {
    const n = name.trim().toLowerCase();
    return catalog.all
      .filter((s) => {
        const sameName = s.name.toLowerCase().includes(n) || n.includes(s.name.toLowerCase());
        const sameBrand = brandId ? s.brandId === brandId : true;
        return sameName && sameBrand;
      })
      .slice(0, 3);
  }

  async function publish() {
    if (!user || !photo) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await (await fetch(photo.uri)).blob();
      const newId = await submit(
        {
          name,
          brandId,
          newBrandName: newBrand,
          type: type!,
          size: size!,
          scent: scent || undefined,
          barcode: barcode || undefined,
          photoBlob: blob,
          photoExt: photo.ext,
        },
        user.id
      );
      router.replace(`/squishy/${newId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't publish.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmitPress() {
    const dupes = findDupes();
    if (dupes.length > 0 && possibleDupes === null) {
      setPossibleDupes(dupes); // first press: warn, don't publish
      return;
    }
    publish();
  }

  if (!configured || !user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Stack.Screen options={{ title: "Add a product" }} />
        <Text style={styles.title}>Add a product</Text>
        <Text style={styles.body}>
          {configured
            ? "Sign in first so your submission can be credited to you."
            : "Accounts aren't set up yet — submissions need a signed-in user."}
        </Text>
        {configured && (
          <PrimaryButton label="Go to Account" onPress={() => router.push("/account")} />
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: "Add a product" }} />
      <Text style={styles.title}>Add a product</Text>
      <Text style={styles.body}>
        Found a squishy that isn't in the database? Add it for everyone — it publishes right away
        with your name on it.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={photo ? "Change photo" : "Add photo"}
        onPress={pickPhoto}
        style={({ pressed }) => [styles.photoBox, pressed && { opacity: 0.8 }]}
      >
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoEmpty}>
            <Text style={{ fontSize: 36 }}>📷</Text>
            <Text style={styles.photoHint}>Add a photo (required)</Text>
          </View>
        )}
      </Pressable>

      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Strawberry Bunny Bun" />

      <View style={{ gap: 6 }}>
        <Text style={styles.fieldLabel}>Brand</Text>
        {brandLabel ? (
          <View style={styles.brandChosen}>
            <Text style={styles.brandChosenText}>
              {brandLabel}
              {newBrand ? " (new brand)" : ""}
            </Text>
            <LinkText
              label="Change"
              onPress={() => {
                setBrandId(null);
                setNewBrand(null);
                setBrandQuery("");
              }}
            />
          </View>
        ) : (
          <>
            <TextInput
              value={brandQuery}
              onChangeText={setBrandQuery}
              placeholder="Start typing a brand…"
              placeholderTextColor={colors.faint}
              style={styles.input}
              accessibilityLabel="Brand"
            />
            {brandMatches.map((b) => (
              <Pressable
                key={b.id}
                accessibilityRole="button"
                onPress={() => setBrandId(b.id)}
                style={({ pressed }) => [styles.brandOption, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.brandOptionText}>{b.name}</Text>
              </Pressable>
            ))}
            {brandQuery.trim().length >= 2 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setNewBrand(brandQuery.trim())}
                style={({ pressed }) => [styles.brandOption, styles.brandNew, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.brandNewText}>＋ Add "{brandQuery.trim()}" as a new brand</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.fieldLabel}>Type</Text>
        <View style={styles.chipWrap}>
          {TYPES.map((t) => (
            <Chip key={t} label={formatLabel(t)} active={type === t} onPress={() => setType(type === t ? null : t)} />
          ))}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.fieldLabel}>Size</Text>
        <View style={styles.chipWrap}>
          {SIZES.map((s) => (
            <Chip key={s} label={formatLabel(s)} active={size === s} onPress={() => setSize(size === s ? null : s)} />
          ))}
        </View>
      </View>

      <Field label="Scent (optional)" value={scent} onChangeText={setScent} placeholder="e.g. strawberry" />
      <Field
        label="Barcode (optional)"
        value={barcode}
        onChangeText={setBarcode}
        placeholder="Scanned or typed from the packaging"
        inputMode="numeric"
      />

      {possibleDupes && possibleDupes.length > 0 && (
        <View style={styles.dupeCard}>
          <Text style={styles.dupeTitle}>This might already exist</Text>
          {possibleDupes.map((d) => (
            <Pressable
              key={d.id}
              accessibilityRole="link"
              onPress={() => router.push(`/squishy/${d.id}`)}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.dupeItem}>
                → {d.name} <Text style={styles.dupeBrand}>({brandLabelOf(d)})</Text>
              </Text>
            </Pressable>
          ))}
          <Text style={styles.dupeHint}>
            If yours is different, press Publish again to submit anyway.
          </Text>
        </View>
      )}

      {error && <Note kind="error">{error}</Note>}
      <PrimaryButton
        label={possibleDupes ? "Publish anyway" : "Publish"}
        busy={busy}
        disabled={!ready}
        onPress={onSubmitPress}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 64,
    width: "100%",
    maxWidth: Math.min(520, MAX_CONTENT_WIDTH),
    alignSelf: "center",
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
    paddingTop: 8,
  },
  body: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  photoBox: {
    aspectRatio: 1.6,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoHint: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.image,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.ink,
  },
  brandOption: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.image,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  brandOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  brandNew: {
    borderStyle: "dashed",
  },
  brandNewText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.wish,
  },
  brandChosen: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.image,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 4,
  },
  brandChosenText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  dupeCard: {
    backgroundColor: "#FFF6E5",
    borderRadius: radius.card,
    padding: 14,
    gap: 8,
  },
  dupeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  dupeItem: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  dupeBrand: {
    color: colors.muted,
    fontWeight: "400",
  },
  dupeHint: {
    fontSize: 13,
    color: colors.muted,
  },
});

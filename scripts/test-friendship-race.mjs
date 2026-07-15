#!/usr/bin/env node
/**
 * Regression test for the duplicate-friendship bug: two users sending
 * each other a request in the same transaction window must converge to
 * exactly ONE friendship row (the unordered-pair unique index plus the
 * accept-on-conflict fallback in sendFriendRequest).
 *
 * Uses the two disposable test accounts. Run after applying
 * supabase/updates-2026-07.sql:
 *   TEST_PW_1=... TEST_PW_2=... node scripts/test-friendship-race.mjs
 * (Passwords default to the known throwaway test-account values.)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);

const URL_ = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const USERS = [
  { email: "muna0001+squishytest1@gmail.com", pw: process.env.TEST_PW_1 || "squishy-test-8472-Xk" },
  { email: "muna0001+squishytest2@gmail.com", pw: process.env.TEST_PW_2 || "squishy-pal-9315-Qz" },
];

// Mirrors the app's sendFriendRequest race branch: try to insert, and on
// a unique violation accept the other side's request instead.
async function raceSend(client, selfId, otherId) {
  const { error } = await client
    .from("friendships")
    .insert({ requester_id: selfId, addressee_id: otherId, status: "pending" });
  if (!error) return "inserted";
  if (error.code !== "23505") throw new Error(error.message);
  const { data } = await client
    .from("friendships")
    .select("id, status, requester_id")
    .or(
      `and(requester_id.eq.${selfId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${selfId})`
    )
    .maybeSingle();
  if (data && data.status === "pending" && data.requester_id === otherId) {
    const { error: acceptErr } = await client
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", data.id);
    if (acceptErr) throw new Error(acceptErr.message);
    return "accepted-theirs";
  }
  return "conflict-noop";
}

const [a, b] = await Promise.all(
  USERS.map(async ({ email, pw }) => {
    const client = createClient(URL_, ANON);
    const { data, error } = await client.auth.signInWithPassword({ email, password: pw });
    if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
    return { client, id: data.user.id, email };
  })
);

// Clean slate: remove any existing friendship between the two.
await a.client.from("friendships").delete().or(
  `and(requester_id.eq.${a.id},addressee_id.eq.${b.id}),and(requester_id.eq.${b.id},addressee_id.eq.${a.id})`
);

// Fire both directions concurrently — the bug's exact trigger.
const results = await Promise.all([
  raceSend(a.client, a.id, b.id),
  raceSend(b.client, b.id, a.id),
]);

const { data: rows } = await a.client
  .from("friendships")
  .select("id, status, requester_id, addressee_id")
  .or(
    `and(requester_id.eq.${a.id},addressee_id.eq.${b.id}),and(requester_id.eq.${b.id},addressee_id.eq.${a.id})`
  );

console.log("race outcomes:", results);
console.log("rows for pair:", rows);

if (rows.length !== 1) {
  console.error(`FAIL: expected exactly 1 friendship row, found ${rows.length}`);
  process.exit(1);
}
console.log(`PASS: single ${rows[0].status} friendship row survives the race`);

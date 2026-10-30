import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing Supabase environment variables.");
}

const db = createClient(url, key);

function calculateRarity(population: number): number {
  if (population >= 5_000_000) return 10;
  if (population >= 1_000_000) return 25;
  if (population >= 500_000) return 40;
  if (population >= 100_000) return 55;
  if (population >= 50_000) return 70;
  if (population >= 25_000) return 85;
  return 95;
}

async function main() {
  const content = await readFile(
    "data/cities15000.txt",
    "utf8"
  );

  const rows = content.trim().split("\n");
  const unique = new Map<string, {
    category: string;
    word: string;
    normalized_word: string;
    rarity: number;
    rarity_score: number;
    verified: boolean;
    source: string;
    reviewed_at: string;
  }>();

  for (const row of rows) {
    const fields = row.split("\t");

    const geonameId = fields[0];
    const name = fields[1]?.trim();
    const population = Number(fields[14] || 0);

    if (!name || !Number.isFinite(population)) continue;

    if (!/^[\p{L}][\p{L}\p{M}' -]*$/u.test(name)) {
      continue;
    }

    const normalized = name.toLocaleLowerCase("en-US");

    const entry = {
      category: "City",
      word: name,
      normalized_word: normalized,
      rarity: calculateRarity(population),
      rarity_score: calculateRarity(population),
      verified: true,
      source: `GeoNames:${geonameId}`,
      reviewed_at: new Date().toISOString(),
    };

    const existing = unique.get(normalized);

    // Prefer the most populous city when names repeat.
    if (!existing || entry.rarity < existing.rarity) {
      unique.set(normalized, entry);
    }
  }

  const entries = [...unique.values()];

  console.log(`Prepared ${entries.length} unique cities.`);

  const batchSize = 250;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    const { error } = await db
      .from("words")
      .upsert(batch, {
        onConflict: "category,normalized_word",
      });

    if (error) throw error;

    console.log(
      `Imported ${Math.min(i + batchSize, entries.length)} / ${entries.length}`
    );
  }

  console.log("City import completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
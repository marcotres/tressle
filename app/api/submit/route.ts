
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/supabase-admin";
import { getDailyChallenge } from "@/lib/daily";

const CATEGORIES = [
  "Name",
  "Object",
  "City",
  "Animal",
  "Profession",
  "Food",
  "Character",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const answers = body.answers || {};
    const daily = getDailyChallenge();

    const db = adminDb();

    if (!db) {
      return NextResponse.json(
        { error: "Server database is not configured." },
        { status: 503 }
      );
    }

    // Verify the user's Supabase session.
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    let user = null;

    if (token) {
      const { data, error } = await db.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json(
          { error: "Your session is invalid. Please sign in again." },
          { status: 401 }
        );
      }

      user = data.user;
    }

    // Calculate the score using verified words only.
    const results = [];
    let total = 0;

    for (const category of CATEGORIES) {
      const answer = String(answers[category] || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 40);

      if (!answer) {
        results.push({
          category,
          answer: "",
          score: 0,
          valid: false,
          rarity: 0,
        });
        continue;
      }

      if (
        !/^[\p{L}][\p{L}\p{M}' -]*$/u.test(answer) ||
        answer[0].toLocaleUpperCase("en-US") !== daily.letter
      ) {
        results.push({
          category,
          answer,
          score: 0,
          valid: false,
          rarity: 0,
        });
        continue;
      }

      const normalized = answer.toLocaleLowerCase("en-US");

      const { data, error } = await db
        .from("words")
        .select("rarity_score")
        .eq("category", category)
        .eq("normalized_word", normalized)
        .eq("verified", true)
        .maybeSingle();

      if (error) throw error;

      const score = data?.rarity_score ?? 0;
      const valid = !!data;

      results.push({
        category,
        answer,
        score,
        valid,
        rarity: score,
      });

      total += score;
    }

    // Anonymous players receive their result but are not ranked.
    if (!user) {
      return NextResponse.json({
        date: daily.date,
        letter: daily.letter,
        total,
        results,
        saved: false,
      });
    }

    // Get the username selected during registration.
    const selectedUsername = String(
      user.user_metadata?.username || ""
    ).trim();

    if (
      selectedUsername &&
      !/^[a-zA-Z0-9_]{3,20}$/.test(selectedUsername)
    ) {
      return NextResponse.json(
        { error: "Invalid username. Please update your account." },
        { status: 400 }
      );
    }

    // Find the player's public profile.
    let { data: profile, error: profileError } = await db
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
      const username =
        selectedUsername ||
        `player_${user.id.replace(/-/g, "").slice(0, 8)}`;

      const { data, error } = await db
        .from("profiles")
        .insert({
          id: user.id,
          username,
        })
        .select("username")
        .single();

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { error: "This username is already taken. Please choose another." },
            { status: 409 }
          );
        }
        throw error;
      }

      profile = data;
    } else if (
      selectedUsername &&
      profile.username.startsWith("player_")
    ) {
      const { data, error } = await db
        .from("profiles")
        .update({ username: selectedUsername })
        .eq("id", user.id)
        .select("username")
        .single();

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { error: "This username is already taken. Please choose another." },
            { status: 409 }
          );
        }
        throw error;
      }

      profile = data;
    }

    // Save or update this player's score for today's challenge.
    const { error: saveError } = await db
      .from("daily_leaderboard")
      .upsert(
        {
          user_id: user.id,
          username: profile.username,
          challenge_date: daily.date,
          total_score: total,
        },
        {
          onConflict: "user_id,challenge_date",
        }
      );

    if (saveError) throw saveError;

    return NextResponse.json({
      date: daily.date,
      letter: daily.letter,
      total,
      results,
      saved: true,
      username: profile.username,
    });
  } catch (e) {
    console.error("Submission error:", e);

    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Something went wrong while submitting.",
      },
      { status: 400 }
    );
  }
}

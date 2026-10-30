
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/supabase-admin";
import { getDailyChallenge } from "@/lib/daily";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = adminDb();

    if (!db) {
      return NextResponse.json(
        { error: "Database is not configured." },
        { status: 503 }
      );
    }

    const daily = getDailyChallenge();

    const { data, error } = await db
      .from("daily_leaderboard")
      .select("username, total_score, created_at")
      .eq("challenge_date", daily.date)
      .order("total_score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) throw error;

    const rankings = (data || []).map((player, index) => ({
      position: index + 1,
      username: player.username,
      score: player.total_score,
    }));

    return NextResponse.json({
      date: daily.date,
      rankings,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);

    return NextResponse.json(
      { error: "Could not load leaderboard." },
      { status: 500 }
    );
  }
}

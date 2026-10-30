import {NextResponse} from "next/server";
import {getDailyChallenge} from "@/lib/daily";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json(getDailyChallenge());}
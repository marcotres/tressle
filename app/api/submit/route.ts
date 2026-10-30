import {NextRequest,NextResponse} from "next/server";
import {adminDb} from "@/lib/supabase-admin";
import {getDailyChallenge} from "@/lib/daily";
const CATEGORIES=["Name","Object","City","Animal","Profession","Food","Character"];
export async function POST(req:NextRequest){
 try{
  const body=await req.json();const answers=body.answers||{};const daily=getDailyChallenge();
  const db=adminDb();if(!db)return NextResponse.json({error:"Server database is not configured yet. Add the Supabase keys from .env.example."},{status:503});
  const results=[];let total=0;
  for(const category of CATEGORIES){
   const answer=String(answers[category]||"").trim().replace(/\s+/g," ").slice(0,40);
   if(!answer){results.push({category,answer:"",score:0,valid:false,rarity:0});continue;}
   if(!/^[\p{L}][\p{L}\p{M}' -]*$/u.test(answer)||answer[0].toLocaleUpperCase("en-US")!==daily.letter){
    results.push({category,answer,score:0,valid:false,rarity:0});continue;
   }
   const normalized=answer.toLocaleLowerCase("en-US");
   const {data,error}=await db.from("words").select("rarity_score").eq("category",category).eq("normalized_word",normalized).eq("verified",true).maybeSingle();
   if(error)throw error;
   const score=data?.rarity_score??0;const valid=!!data;
   results.push({category,answer,score,valid,rarity:score});total+=score;
  }
  // Anonymous play is supported. A score is persisted once authentication is wired in.
  return NextResponse.json({date:daily.date,letter:daily.letter,total,results,saved:false});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid submission."},{status:400});}
}
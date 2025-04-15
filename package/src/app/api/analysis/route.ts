import { analyzeSpending } from "@/app/lib/llmAnalysis";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { userId, question } = await req.json();
  
  const analysis = await analyzeSpending(userId, question);
  
  return NextResponse.json(analysis);
}
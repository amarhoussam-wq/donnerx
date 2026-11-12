import { NextRequest, NextResponse } from "next/server";
import { analyzePasswordRemote } from "@/lib/security-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { password = "", check_breach = true } = body;

    if (!password) {
      return NextResponse.json({ error: "كلمة المرور مطلوبة" }, { status: 400 });
    }

    const analysis = await analyzePasswordRemote(password, check_breach !== false);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[API Analyze Error]:", error);
    return NextResponse.json({ error: "فشل فحص كلمة المرور" }, { status: 500 });
  }
}

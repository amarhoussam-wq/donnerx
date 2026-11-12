import { NextRequest, NextResponse } from "next/server";
import { generatePasswordRemote } from "@/lib/security-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await generatePasswordRemote(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API Generate Error]:", error);
    return NextResponse.json({ error: "فشل توليد كلمة المرور" }, { status: 500 });
  }
}

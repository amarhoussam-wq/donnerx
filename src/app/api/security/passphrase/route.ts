import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_URL = "https://r40owskko8c00wck04ogk8wg.194.34.232.105.sslip.io";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const baseUrl = process.env.SECURITY_API_URL?.trim() || DEFAULT_API_URL;

    const res = await fetch(`${baseUrl}/generate/passphrase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[Passphrase API Error]:", error);
    return NextResponse.json({ error: "فشل توليد عبارة المرور" }, { status: 500 });
  }
}

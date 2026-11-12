import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_URL = "https://r40owskko8c00wck04ogk8wg.194.34.232.105.sslip.io";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = "setup", ...payload } = body;
    const baseUrl = process.env.SECURITY_API_URL?.trim() || DEFAULT_API_URL;

    let targetEndpoint = `${baseUrl}/2fa/setup`;
    if (action === "verify") {
      targetEndpoint = `${baseUrl}/2fa/verify`;
    } else if (action === "generate") {
      targetEndpoint = `${baseUrl}/2fa/generate`;
    }

    const res = await fetch(targetEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("[2FA API Error]:", error);
    return NextResponse.json({ error: "فشل تنفيذ عملية المصادقة الثنائية" }, { status: 500 });
  }
}

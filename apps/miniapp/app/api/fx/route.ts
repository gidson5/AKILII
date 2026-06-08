import { NextResponse } from "next/server";

const CURRENCIES = ["NGN", "KES", "GHS", "ZAR"];

export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("upstream error");
    const json = await res.json() as {
      rates: Record<string, number>;
      time_last_update_unix: number;
    };

    const rates: Record<string, number> = {};
    for (const cur of CURRENCIES) {
      rates[cur] = json.rates[cur] ?? 0;
    }

    return NextResponse.json({
      rates,
      updatedAt: new Date(json.time_last_update_unix * 1000).toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch FX rates" }, { status: 500 });
  }
}

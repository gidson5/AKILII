import { NextRequest, NextResponse } from "next/server";
import { fetchWalletData } from "../../../lib/celo-transactions";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  const days = parseInt(request.nextUrl.searchParams.get("days") ?? "90");

  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  try {
    const wallet = await fetchWalletData(address, Math.min(days, 365));
    return NextResponse.json(wallet);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch wallet data" },
      { status: 500 }
    );
  }
}

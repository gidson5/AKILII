import { NextRequest, NextResponse } from "next/server";
import { fetchWalletData } from "../../../lib/celo-transactions";
import { researchAddress } from "../../../lib/linkup";
import { generateWalletReport } from "@yield-copilot/agents";
import { z } from "zod";

const reportRequestSchema = z.object({
  walletAddress: z.string().min(1),
  reportType: z.enum(["spending-advice", "account-summary", "wallet-audit", "wallet-statement", "monthly-plan", "financial-health"]),
  days: z.number().int().positive().max(365).optional().default(90)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, reportType, days } = reportRequestSchema.parse(body);

    const wallet = await fetchWalletData(walletAddress, days);

    // research any unknown contracts via Linkup to enrich the report
    let linkupContext: string | undefined;
    if (wallet.unknownContracts.length > 0) {
      const researched = await Promise.all(
        wallet.unknownContracts.slice(0, 3).map(addr => researchAddress(addr))
      );
      const merged = researched.filter(Boolean).join("\n\n");
      if (merged) linkupContext = merged;
    }

    const analysis = await generateWalletReport(wallet, reportType, linkupContext);

    return NextResponse.json({
      ...analysis,
      walletAddress,
      transactionCount: wallet.transactions.length,
      periodDays: days
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 400 }
    );
  }
}

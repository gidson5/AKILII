import { generateRecommendationWithLLM } from "@yield-copilot/agents";
import { recommendationRequestSchema } from "@yield-copilot/shared";
import { NextRequest, NextResponse } from "next/server";
import {
  X402_ENABLED,
  buildPaymentDetails,
  parsePaymentProof,
  verifyPayment
} from "../../../lib/x402";

export async function POST(request: NextRequest) {
  // x402: require micropayment if AGENT_PAYMENT_RECIPIENT is configured
  if (X402_ENABLED) {
    const paymentHeader = request.headers.get("X-Payment");

    if (!paymentHeader) {
      const details = buildPaymentDetails(request.url);
      return new NextResponse(
        JSON.stringify({ error: "Payment required", details }),
        {
          status: 402,
          headers: {
            "Content-Type": "application/json",
            "X-Payment-Required": JSON.stringify(details)
          }
        }
      );
    }

    const proof = parsePaymentProof(paymentHeader);
    if (!proof) {
      return NextResponse.json(
        { error: "Malformed X-Payment header" },
        { status: 400 }
      );
    }

    const valid = await verifyPayment(proof);
    if (!valid) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 402 }
      );
    }
  }

  try {
    const body = await request.json();
    const input = recommendationRequestSchema.parse(body);
    const result = await generateRecommendationWithLLM(input);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}

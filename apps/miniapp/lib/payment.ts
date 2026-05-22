"use client";

import { encodeFunctionData, parseUnits } from "viem";

const USDC_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as `0x${string}`;

export const PDF_PRICE_DISPLAY = "$0.05";
export const PDF_PRICE_USDC = parseUnits("0.05", 6); // 50_000 — USDC has 6 decimals

const PAID_KEY = "akili_pdf_paid_until";
const PAID_TTL = 24 * 60 * 60 * 1000; // 24 hours

const TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

export function hasPaidRecently(): boolean {
  try {
    const until = Number(localStorage.getItem(PAID_KEY) ?? "0");
    return Date.now() < until;
  } catch { return false; }
}

function recordPayment(): void {
  try {
    localStorage.setItem(PAID_KEY, String(Date.now() + PAID_TTL));
  } catch { /* ignore */ }
}

type EthProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export async function payForStatement(): Promise<string> {
  const recipient = process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT as `0x${string}` | undefined;
  if (!recipient) throw new Error("Payment recipient not configured.");

  const ethereum = (window as unknown as { ethereum?: EthProvider }).ethereum;
  if (!ethereum?.request) throw new Error("No wallet found — please open in MiniPay.");

  const accounts = await ethereum.request({ method: "eth_accounts" }) as string[];
  if (!accounts?.[0]) throw new Error("Wallet not connected.");

  const data = encodeFunctionData({
    abi: TRANSFER_ABI,
    functionName: "transfer",
    args: [recipient, PDF_PRICE_USDC],
  });

  const txHash = await ethereum.request({
    method: "eth_sendTransaction",
    params: [{
      from: accounts[0],
      to: USDC_ADDRESS,
      data,
      value: "0x0",
    }],
  }) as string;

  recordPayment();
  return txHash;
}

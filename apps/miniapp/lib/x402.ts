import { createPublicClient, http, parseAbi } from "viem";
import { celo } from "viem/chains";

const USDC_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as const;
const USDC_DECIMALS = 6;
const PAYMENT_AMOUNT = 10000n; // 0.01 USDC

const erc20TransferAbi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)"
]);

const publicClient = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org")
});

export type X402PaymentDetails = {
  version: "1";
  scheme: "exact";
  network: "celo";
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra: Record<string, unknown>;
};

export type X402PaymentProof = {
  from: string;
  txHash: `0x${string}`;
  scheme: "exact";
  network: "celo";
  amount: string;
  asset: string;
};

export function buildPaymentDetails(resource: string): X402PaymentDetails {
  const recipient = process.env.AGENT_PAYMENT_RECIPIENT ?? "";
  return {
    version: "1",
    scheme: "exact",
    network: "celo",
    maxAmountRequired: PAYMENT_AMOUNT.toString(),
    resource,
    description: "AI yield recommendation — 0.01 USDC on Celo",
    mimeType: "application/json",
    payTo: recipient,
    maxTimeoutSeconds: 300,
    asset: USDC_ADDRESS,
    extra: { name: "Akili", chainId: 42220 }
  };
}

export async function verifyPayment(proof: X402PaymentProof): Promise<boolean> {
  const recipient = process.env.AGENT_PAYMENT_RECIPIENT;
  if (!recipient) return false;

  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: proof.txHash
    });

    if (!receipt || receipt.status !== "success") return false;

    // Check the tx is recent (within maxTimeoutSeconds)
    const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
    const age = BigInt(Math.floor(Date.now() / 1000)) - block.timestamp;
    if (age > 300n) return false;

    // Find USDC Transfer log to recipient with sufficient amount
    const transferLogs = receipt.logs.filter(
      (log) => log.address.toLowerCase() === USDC_ADDRESS.toLowerCase()
    );

    for (const log of transferLogs) {
      try {
        const decoded = decodeTransferLog(log.topics, log.data);
        if (
          decoded.to.toLowerCase() === recipient.toLowerCase() &&
          decoded.value >= PAYMENT_AMOUNT
        ) {
          return true;
        }
      } catch {
        continue;
      }
    }

    return false;
  } catch {
    return false;
  }
}

function decodeTransferLog(
  topics: readonly `0x${string}`[],
  data: `0x${string}`
): { from: string; to: string; value: bigint } {
  // Transfer(address,address,uint256) — topic[0] is sig, [1] is from, [2] is to
  if (topics.length < 3) throw new Error("not a Transfer log");
  const from = `0x${topics[1]!.slice(26)}`;
  const to = `0x${topics[2]!.slice(26)}`;
  const value = BigInt(data);
  return { from, to, value };
}

export function parsePaymentProof(header: string): X402PaymentProof | null {
  try {
    const parsed = JSON.parse(header) as Partial<X402PaymentProof>;
    if (
      typeof parsed.txHash !== "string" ||
      typeof parsed.from !== "string" ||
      parsed.scheme !== "exact" ||
      parsed.network !== "celo"
    ) {
      return null;
    }
    return parsed as X402PaymentProof;
  } catch {
    return null;
  }
}

export const X402_ENABLED = Boolean(process.env.AGENT_PAYMENT_RECIPIENT);

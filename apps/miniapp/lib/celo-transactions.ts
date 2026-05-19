const CELOSCAN_BASE = "https://api.celoscan.io/api";

const KNOWN_TOKENS: Record<string, string> = {
  "0xceba9300f2b948710d2653dd7b07f33a8b32118c": "USDC",
  "0x617f3112bf5397d0467d315cc709ef968d9ba546": "USDT",
  "0x765de816845861e75a25fca122bb6898b8b1282a": "cUSD",
  "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73": "cEUR",
  "0xe8537a3d056da446677b9e9d6c5db704eaab4787": "cREAL"
};

const KNOWN_CONTRACTS: Record<string, string> = {
  "0x1111111111111111111111111111111111111111": "MiniPay Boost",
  "0x00be914168be31c5b5b314f0c3be5a28b9e00000": "Ubeswap",
  "0x3d79edaabc0eab6f08ed885c05fc0b014290d95a": "Mento",
};

export type CeloTransaction = {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  gasUsed: string;
  gasPrice: string;
  isError: string;
  input: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
  contractAddress?: string;
};

export type ParsedTransaction = {
  hash: string;
  timestamp: number;
  date: string;
  type: "received" | "sent" | "contract" | "failed";
  category: "transfer" | "defi" | "fee" | "unknown";
  amount: string;
  token: string;
  counterparty: string;
  counterpartyLabel: string;
  gasFeeUSD: string;
  raw: CeloTransaction;
};

export type WalletSummary = {
  address: string;
  transactions: ParsedTransaction[];
  totalReceived: Record<string, number>;
  totalSent: Record<string, number>;
  totalGasFeesUSD: number;
  uniqueContracts: string[];
  unknownContracts: string[];
  periodDays: number;
  fetchedAt: string;
};

async function celoscan(params: Record<string, string>): Promise<{ result: CeloTransaction[] }> {
  const url = new URL(CELOSCAN_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const apiKey = process.env.CELOSCAN_API_KEY ?? "YourApiKeyToken";
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Celoscan error: ${res.status}`);
  return res.json();
}

function labelAddress(address: string, walletAddress: string): string {
  const lower = address.toLowerCase();
  if (lower === walletAddress.toLowerCase()) return "Your wallet";
  return KNOWN_CONTRACTS[lower] ?? shortenAddress(address);
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatAmount(value: string, decimals = 18): string {
  const num = Number(BigInt(value)) / Math.pow(10, decimals);
  return num.toFixed(4);
}

function parseTx(tx: CeloTransaction, walletAddress: string): ParsedTransaction {
  const wallet = walletAddress.toLowerCase();
  const isIncoming = tx.to?.toLowerCase() === wallet;
  const isContract = tx.input && tx.input !== "0x" && tx.input.length > 2;
  const failed = tx.isError === "1";

  let type: ParsedTransaction["type"] = isIncoming ? "received" : "sent";
  if (failed) type = "failed";
  if (isContract && !isIncoming) type = "contract";

  const category: ParsedTransaction["category"] =
    failed ? "fee" :
    isContract ? "defi" :
    (isIncoming || type === "sent") ? "transfer" : "unknown";

  const token = tx.tokenSymbol ??
    (KNOWN_TOKENS[tx.contractAddress?.toLowerCase() ?? ""] ?? "CELO");

  const decimals = tx.tokenDecimal ? Number(tx.tokenDecimal) : 18;
  const amount = formatAmount(tx.value || "0", decimals);

  const counterparty = isIncoming ? (tx.from ?? "") : (tx.to ?? "");
  const counterpartyLabel = labelAddress(counterparty, walletAddress);

  const gasWei = BigInt(tx.gasUsed || "0") * BigInt(tx.gasPrice || "0");
  const gasFeeUSD = (Number(gasWei) / 1e18 * 0.5).toFixed(6);

  const timestamp = Number(tx.timeStamp);
  const date = new Date(timestamp * 1000).toISOString().split("T")[0]!;

  return {
    hash: tx.hash,
    timestamp,
    date,
    type,
    category,
    amount,
    token,
    counterparty,
    counterpartyLabel,
    gasFeeUSD,
    raw: tx
  };
}

export async function fetchWalletData(
  walletAddress: string,
  days = 90
): Promise<WalletSummary> {
  const startTimestamp = Math.floor(Date.now() / 1000) - days * 86400;

  const [nativeTxs, tokenTxs] = await Promise.allSettled([
    celoscan({
      module: "account",
      action: "txlist",
      address: walletAddress,
      sort: "desc",
      startblock: "0",
      endblock: "99999999"
    }),
    celoscan({
      module: "account",
      action: "tokentx",
      address: walletAddress,
      sort: "desc",
      startblock: "0",
      endblock: "99999999"
    })
  ]);

  const allRaw: CeloTransaction[] = [];

  if (nativeTxs.status === "fulfilled" && Array.isArray(nativeTxs.value.result)) {
    allRaw.push(...nativeTxs.value.result.filter(t => Number(t.timeStamp) >= startTimestamp));
  }
  if (tokenTxs.status === "fulfilled" && Array.isArray(tokenTxs.value.result)) {
    allRaw.push(...tokenTxs.value.result.filter(t => Number(t.timeStamp) >= startTimestamp));
  }

  // deduplicate by hash + token
  const seen = new Set<string>();
  const unique = allRaw.filter(tx => {
    const key = `${tx.hash}-${tx.tokenSymbol ?? "native"}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const transactions = unique
    .map(tx => parseTx(tx, walletAddress))
    .sort((a, b) => b.timestamp - a.timestamp);

  // aggregate totals
  const totalReceived: Record<string, number> = {};
  const totalSent: Record<string, number> = {};
  let totalGasFeesUSD = 0;

  for (const tx of transactions) {
    const amt = parseFloat(tx.amount);
    if (tx.type === "received") {
      totalReceived[tx.token] = (totalReceived[tx.token] ?? 0) + amt;
    } else if (tx.type === "sent" || tx.type === "contract") {
      totalSent[tx.token] = (totalSent[tx.token] ?? 0) + amt;
    }
    totalGasFeesUSD += parseFloat(tx.gasFeeUSD);
  }

  const uniqueContracts = [
    ...new Set(
      transactions
        .filter(t => t.category === "defi")
        .map(t => t.counterparty.toLowerCase())
        .filter(Boolean)
    )
  ];

  const unknownContracts = uniqueContracts.filter(
    addr => !KNOWN_CONTRACTS[addr]
  );

  return {
    address: walletAddress,
    transactions,
    totalReceived,
    totalSent,
    totalGasFeesUSD,
    uniqueContracts,
    unknownContracts,
    periodDays: days,
    fetchedAt: new Date().toISOString()
  };
}

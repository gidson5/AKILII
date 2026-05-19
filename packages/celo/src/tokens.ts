import type { Token } from "@yield-copilot/shared";

export const stableTokens: Record<
  Token,
  { symbol: Token; decimals: number; displayName: string; address: `0x${string}` }
> = {
  USDT: {
    symbol: "USDT",
    decimals: 6,
    displayName: "Tether USD",
    address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e"
  },
  USDC: {
    symbol: "USDC",
    decimals: 6,
    displayName: "USD Coin",
    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C"
  },

};

export const stableTokenList = Object.values(stableTokens);

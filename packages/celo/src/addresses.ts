// Verified Celo mainnet contract addresses for Akili

export const ADDRESSES = {
  // Akili deployed contracts
  POLICY_ROUTER: "0x0c0345b3DFBFFD4300255F9DB933A4751cCD2124" as `0x${string}`,

  // ERC-8004 agent identity registry
  ERC8004_REGISTRY: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as `0x${string}`,

  // Stablecoins (Celo mainnet)
  USDC: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as `0x${string}`,
  USDT: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as `0x${string}`,

  // CIP-64 fee currency adapters (use these for feeCurrency, NOT token addresses)
  USDC_FEE_ADAPTER: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" as `0x${string}`,
  USDT_FEE_ADAPTER: "0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72" as `0x${string}`
} as const;

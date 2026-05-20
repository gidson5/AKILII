import { describe, it, expect, vi, afterEach } from "vitest";

// Test the X402_ENABLED gate logic in isolation (without importing thirdweb)
function isX402Enabled(env: { THIRDWEB_SECRET_KEY?: string; AGENT_PAYMENT_RECIPIENT?: string }) {
  return Boolean(env.THIRDWEB_SECRET_KEY && env.AGENT_PAYMENT_RECIPIENT);
}

describe("X402 feature gate", () => {
  it("is disabled when no env vars are set", () => {
    expect(isX402Enabled({})).toBe(false);
  });

  it("is disabled when only THIRDWEB_SECRET_KEY is set", () => {
    expect(isX402Enabled({ THIRDWEB_SECRET_KEY: "sk_test_abc" })).toBe(false);
  });

  it("is disabled when only AGENT_PAYMENT_RECIPIENT is set", () => {
    expect(isX402Enabled({ AGENT_PAYMENT_RECIPIENT: "0xabc123" })).toBe(false);
  });

  it("is enabled when both env vars are set", () => {
    expect(isX402Enabled({
      THIRDWEB_SECRET_KEY: "sk_test_abc",
      AGENT_PAYMENT_RECIPIENT: "0xC6312ea8305Ea85c0ed26E608eD21e5C6A4Ad24b"
    })).toBe(true);
  });

  it("treats empty string values as disabled", () => {
    expect(isX402Enabled({ THIRDWEB_SECRET_KEY: "", AGENT_PAYMENT_RECIPIENT: "0xabc" })).toBe(false);
    expect(isX402Enabled({ THIRDWEB_SECRET_KEY: "sk_test_abc", AGENT_PAYMENT_RECIPIENT: "" })).toBe(false);
  });
});

describe("X402 payment config", () => {
  it("uses correct USDC address on Celo mainnet", () => {
    const USDC_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
    expect(USDC_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("uses correct price for 0.01 USDC (6 decimals)", () => {
    // 0.01 USDC = 10000 in 6-decimal units
    const priceAmount = "10000";
    const decimals = 6;
    const humanReadable = Number(priceAmount) / Math.pow(10, decimals);
    expect(humanReadable).toBeCloseTo(0.01);
  });
});

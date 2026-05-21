"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "../../components/bottom-nav";
import { useMiniPay } from "../../hooks/use-minipay";
import { useStableTokenBalances } from "../../hooks/use-stable-token-balances";
import { type AlertPeriod } from "../../lib/budget-store";

type Tx = {
  timestamp: number;
  type: string;
  category: string;
  amount: string;
  token: string;
  counterpartyLabel: string;
};

type WalletData = {
  transactions: Tx[];
  totalReceived: Record<string, number>;
  totalSent: Record<string, number>;
  totalGasFeesUSD: number;
};

const PERIODS: { label: string; value: AlertPeriod; seconds: number }[] = [
  { label: "Today",   value: "daily",     seconds: 86_400 },
  { label: "Week",    value: "weekly",    seconds: 7 * 86_400 },
  { label: "Month",   value: "monthly",   seconds: 30 * 86_400 },
  { label: "Quarter", value: "quarterly", seconds: 90 * 86_400 },
];

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  transfer: { label: "Transfers",       color: "#60A5FA", emoji: "💸" },
  defi:     { label: "Savings & DeFi",  color: "#3DD68C", emoji: "🌱" },
  fee:      { label: "Network Fees",    color: "#F97316", emoji: "⛽" },
  unknown:  { label: "Other",           color: "#94A3B8", emoji: "📦" },
};

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BudgetBar({ label, emoji, color, actual, limit }: {
  label: string; emoji: string; color: string; actual: number; limit?: number;
}) {
  const pct = limit ? Math.min(100, (actual / limit) * 100) : 0;
  const over = limit ? actual > limit : false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "var(--ink-70)", display: "flex", alignItems: "center", gap: "5px" }}>
          <span>{emoji}</span> {label}
        </span>
        <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: over ? "var(--coral-ink)" : "var(--ink-70)", fontWeight: 600 }}>
          ${actual.toFixed(2)}{limit ? ` / $${limit}` : ""}
        </span>
      </div>
      {limit ? (
        <div style={{ height: "6px", borderRadius: "3px", background: "var(--line)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: over ? "var(--coral)" : color, borderRadius: "3px", transition: "width 0.6s ease" }} />
        </div>
      ) : (
        <div style={{ height: "6px", borderRadius: "3px", background: color, opacity: 0.3 }} />
      )}
    </div>
  );
}

export default function BudgetPage() {
  const { walletAddress } = useMiniPay();
  const { balances } = useStableTokenBalances(walletAddress);
  const [period, setPeriod] = useState<AlertPeriod>("monthly");
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalBalance = useMemo(
    () => balances.reduce((s, b) => s + (parseFloat(b.displayAmount.replace(/,/g, "")) || 0), 0),
    [balances]
  );

  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    setError("");
    fetch(`/api/wallet?address=${walletAddress}&days=92`)
      .then(r => r.json())
      .then((d: WalletData) => setWallet(d))
      .catch(() => setError("Could not load transactions."))
      .finally(() => setLoading(false));
  }, [walletAddress]);

  const periodSeconds = PERIODS.find(p => p.value === period)!.seconds;
  const cutoff = Math.floor(Date.now() / 1000) - periodSeconds;

  const periodTxs = useMemo(
    () => wallet?.transactions.filter(t => t.timestamp >= cutoff) ?? [],
    [wallet, cutoff]
  );

  const totalSpent = useMemo(
    () => periodTxs
      .filter(t => t.type === "sent" || t.type === "contract")
      .reduce((s, t) => s + parseFloat(t.amount), 0),
    [periodTxs]
  );

  const totalReceived = useMemo(
    () => periodTxs
      .filter(t => t.type === "received")
      .reduce((s, t) => s + parseFloat(t.amount), 0),
    [periodTxs]
  );

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of periodTxs) {
      if (tx.type !== "sent" && tx.type !== "contract") continue;
      map[tx.category] = (map[tx.category] ?? 0) + parseFloat(tx.amount);
    }
    return map;
  }, [periodTxs]);

  // top 5 counterparties (sent)
  const topCounterparties = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of periodTxs) {
      if (tx.type !== "sent" && tx.type !== "contract") continue;
      map[tx.counterpartyLabel] = (map[tx.counterpartyLabel] ?? 0) + parseFloat(tx.amount);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [periodTxs]);

  if (!walletAddress) {
    return (
      <main className="page-shell">
        <div className="dashboard">
          <header className="dashboard-topbar">
            <div className="dashboard-brand">
              <span className="dashboard-brand__mark">A</span>
              <div className="dashboard-brand__name">Budget</div>
            </div>
          </header>
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "14px" }}>📊</div>
            <strong style={{ fontSize: "1.1rem" }}>Connect your wallet</strong>
            <p style={{ color: "var(--ink-55)", fontSize: "0.88rem", marginTop: "8px" }}>
              Connect MiniPay to see your spend sheet.
            </p>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="dashboard">
        {/* Header */}
        <div style={{
          padding: "calc(14px + env(safe-area-inset-top)) 16px 0",
          background: "rgba(244, 241, 234, 0.92)",
          backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 20,
          borderBottom: "1px solid var(--line)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Link href="/" className="dashboard-topbar__icon" aria-label="Back">
              <BackIcon />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--ink)", fontSize: "15px", fontWeight: 600, letterSpacing: "-0.02em" }}>Spend Sheet</div>
              <div style={{ color: "var(--ink-55)", fontSize: "11px" }}>Where your money went</div>
            </div>
            <Link href="/alerts" style={{ fontSize: "11px", color: "var(--ink-55)", textDecoration: "none", padding: "4px 8px", border: "1px solid var(--line)", borderRadius: "8px" }}>
              Set Alerts
            </Link>
          </div>

          {/* Period selector */}
          <div className="segmented-row" style={{ margin: "0 0 12px" }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`segmented-row__item${period === p.value ? " is-active" : ""}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px", paddingBottom: "100px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: "80px", borderRadius: "18px", background: "var(--surface)", border: "1px solid var(--line)", animation: "pulse 1.4s ease-in-out infinite" }} />
              ))}
            </div>
          )}

          {error && (
            <div className="notice-card danger">
              <strong>{error}</strong>
            </div>
          )}

          {!loading && wallet && (
            <>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "18px", padding: "14px" }}>
                  <div style={{ fontSize: "10px", color: "var(--ink-55)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Spent</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--coral-ink)", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
                    ${totalSpent.toFixed(2)}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--ink-40)", marginTop: "2px" }}>{periodTxs.filter(t => t.type === "sent" || t.type === "contract").length} transactions</div>
                </div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "18px", padding: "14px" }}>
                  <div style={{ fontSize: "10px", color: "var(--ink-55)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Received</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--green-ink)", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
                    ${totalReceived.toFixed(2)}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--ink-40)", marginTop: "2px" }}>Balance: ${totalBalance.toFixed(2)}</div>
                </div>
              </div>

              {/* Net position */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "18px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", color: "var(--ink-55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Net position</span>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: (totalReceived - totalSpent) >= 0 ? "var(--green-ink)" : "var(--coral-ink)", fontFamily: "var(--font-mono)" }}>
                    {(totalReceived - totalSpent) >= 0 ? "+" : ""}${(totalReceived - totalSpent).toFixed(2)}
                  </span>
                </div>
                {/* in/out bar */}
                {(totalReceived + totalSpent) > 0 && (
                  <div style={{ height: "8px", borderRadius: "4px", overflow: "hidden", background: "var(--line)", display: "flex" }}>
                    <div style={{ height: "100%", width: `${(totalReceived / (totalReceived + totalSpent)) * 100}%`, background: "var(--green)", transition: "width 0.6s ease" }} />
                    <div style={{ height: "100%", flex: 1, background: "var(--coral)" }} />
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <span style={{ fontSize: "10px", color: "var(--green-ink)" }}>In</span>
                  <span style={{ fontSize: "10px", color: "var(--coral-ink)" }}>Out</span>
                </div>
              </div>

              {/* Spending by category */}
              {Object.keys(byCategory).length > 0 && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "18px", padding: "16px" }}>
                  <div className="dashboard-section-head" style={{ marginBottom: "14px" }}>
                    <p className="section-label">By category</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {Object.entries(byCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, amt]) => {
                        const meta = CATEGORY_META[cat] ?? CATEGORY_META.unknown!;
                        return (
                          <BudgetBar
                            key={cat}
                            label={meta.label}
                            emoji={meta.emoji}
                            color={meta.color}
                            actual={amt}
                          />
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Top counterparties */}
              {topCounterparties.length > 0 && (
                <div>
                  <div className="dashboard-section-head" style={{ marginBottom: "10px" }}>
                    <p className="section-label">Top payees</p>
                  </div>
                  <div className="list-card">
                    {topCounterparties.map(([label, amt], i) => (
                      <div key={label} className={`list-card__row${i === topCounterparties.length - 1 ? " list-card__row--last" : ""}`}>
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: "13px" }}>{label}</strong>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--coral-ink)", fontFamily: "var(--font-mono)" }}>
                          ${amt.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {periodTxs.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--ink-55)", fontSize: "14px" }}>
                  No transactions in this period.
                </div>
              )}

              <Link
                href="/alerts"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "14px", borderRadius: "16px",
                  background: "var(--ink)", color: "#fffdf7",
                  textDecoration: "none", fontSize: "14px", fontWeight: 600
                }}
              >
                ⚡ Set Spending Alerts
              </Link>
            </>
          )}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
      <BottomNav />
    </main>
  );
}

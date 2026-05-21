"use client";

import { useEffect, useState } from "react";
import {
  type AlertRule,
  type SpendSnapshot,
  FUNNY_QUOTES,
  PERIOD_LABELS,
  checkTriggeredRules,
  dismissAlerts,
  getCachedSnapshot,
  getRules,
  isDismissedToday,
  setCachedSnapshot,
} from "../lib/budget-store";

type Props = {
  walletAddress: string | undefined;
  totalBalance: number;
};

export function SpendingAlertModal({ walletAddress, totalBalance }: Props) {
  const [triggered, setTriggered] = useState<AlertRule[]>([]);
  const [snap, setSnap] = useState<SpendSnapshot | null>(null);
  const [quote] = useState(() => FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)]!);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!walletAddress || isDismissedToday()) return;
    const rules = getRules();
    if (rules.length === 0) return;

    async function check() {
      const cached = getCachedSnapshot();
      let snapshot = cached;

      if (!snapshot) {
        try {
          const res = await fetch(`/api/wallet?address=${walletAddress}&days=92`);
          if (!res.ok) return;
          const wallet = await res.json() as {
            transactions: { timestamp: number; type: string; amount: string }[];
            totalReceived: Record<string, number>;
          };
          const now = Math.floor(Date.now() / 1000);
          const sum = (cutoff: number) =>
            wallet.transactions
              .filter(t => t.timestamp >= cutoff && (t.type === "sent" || t.type === "contract"))
              .reduce((s, t) => s + parseFloat(t.amount), 0);

          const yieldEarned = Object.values(wallet.totalReceived).reduce((s, v) => s + v, 0);

          snapshot = {
            daily:     sum(now - 86_400),
            weekly:    sum(now - 7 * 86_400),
            monthly:   sum(now - 30 * 86_400),
            quarterly: sum(now - 90 * 86_400),
            totalBalance: totalBalance ?? 0,
            yieldEarned,
            cachedAt: new Date().toISOString(),
          };
          setCachedSnapshot(snapshot);
        } catch { return; }
      }

      const hit = checkTriggeredRules(rules, snapshot);
      if (hit.length > 0) {
        setSnap(snapshot);
        setTriggered(hit);
        setVisible(true);
      }
    }

    void check();
  }, [walletAddress, totalBalance]);

  if (!visible || triggered.length === 0) return null;

  function handleDismiss() {
    dismissAlerts();
    setVisible(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(22, 20, 14, 0.55)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0 0 env(safe-area-inset-bottom)",
      animation: "fadeIn 0.2s ease"
    }}>
      <div style={{
        width: "min(100%, 420px)",
        background: "var(--surface)",
        borderRadius: "28px 28px 0 0",
        padding: "28px 24px 32px",
        boxShadow: "0 -8px 40px rgba(22,20,14,0.18)",
        animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)"
      }}>
        {/* drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--line-strong)", margin: "0 auto 20px" }} />

        {/* icon + title */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "40px", lineHeight: 1, marginBottom: "10px" }}>💸</div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
            Spending Cap Reached
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-55)", marginTop: "6px", fontStyle: "italic" }}>
            {quote}
          </p>
        </div>

        {/* triggered rules */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          {triggered.map(rule => {
            const actual = rule.period && snap ? snap[rule.period] : 0;
            const pct = Math.min(100, (actual / rule.amount) * 100);
            return (
              <div key={rule.id} style={{
                background: "var(--bg-soft)",
                borderRadius: "16px",
                padding: "12px 14px",
                border: "1px solid var(--line)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink)" }}>
                    {rule.period ? PERIOD_LABELS[rule.period] : ""} {rule.label}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--coral-ink)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    ${actual.toFixed(2)} / ${rule.amount}
                  </span>
                </div>
                <div style={{ height: "4px", borderRadius: "2px", background: "var(--line)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "var(--coral)", borderRadius: "2px", transition: "width 0.6s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <a
            href="/budget"
            style={{
              flex: 1, textAlign: "center", padding: "12px", borderRadius: "14px",
              background: "var(--bg-soft)", border: "1px solid var(--line)",
              fontSize: "0.88rem", color: "var(--ink-70)", textDecoration: "none", fontWeight: 500
            }}
          >
            View Budget
          </a>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              flex: 2, padding: "12px", borderRadius: "14px",
              background: "var(--ink)", color: "#fffdf7",
              border: "none", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer"
            }}
          >
            Got it! 👍
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  );
}

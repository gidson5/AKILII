"use client";

import { useEffect, useState } from "react";
import {
  type FxRates,
  type LocalCurrency,
  CURRENCY_META,
  convertUSD,
  fetchFxRates,
  formatLocal,
  getPreferredCurrency,
} from "../lib/currency";

function monthsToReach(balance: number, monthly: number, target: number, apy: number): number {
  if (target <= balance) return 0;
  if (monthly <= 0 && apy <= 0) return -1;
  const r = Math.pow(1 + apy / 100, 1 / 12) - 1;
  let b = balance;
  for (let m = 1; m <= 600; m++) {
    b = b * (1 + (r || 0)) + monthly;
    if (b >= target) return m;
  }
  return -1;
}

function formatDuration(months: number): string {
  if (months === 0) return "Already reached!";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} month${m !== 1 ? "s" : ""}`;
  if (m === 0) return `${y} year${y !== 1 ? "s" : ""}`;
  return `${y}y ${m}m`;
}

function CalcInput({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "10px", color: "var(--ink-40)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        min="0"
        step="any"
        style={{
          background: "var(--bg-soft)", border: "1px solid var(--line)", borderRadius: "10px",
          padding: "8px 10px", fontSize: "14px", fontWeight: 600, color: "var(--ink)",
          fontFamily: "var(--font-mono)", outline: "none", width: "100%",
        }}
      />
    </div>
  );
}

export function SavingsCalculator() {
  const [balance, setBalance] = useState("");
  const [monthly, setMonthly] = useState("");
  const [target, setTarget] = useState("");
  const [apy, setApy] = useState("5");
  const [rates, setRates] = useState<FxRates | null>(null);
  const [localCurrency, setLocalCurrency] = useState<LocalCurrency>("USD");

  useEffect(() => {
    setLocalCurrency(getPreferredCurrency());
    void fetchFxRates().then(setRates);
  }, []);

  const b = parseFloat(balance) || 0;
  const m = parseFloat(monthly) || 0;
  const t = parseFloat(target) || 0;
  const a = parseFloat(apy) || 0;
  const hasInputs = t > 0;

  const months = hasInputs ? monthsToReach(b, m, t, a) : null;
  const interestGained = hasInputs && months !== null && months > 0 && months !== -1
    ? (t - b - m * months)
    : null;

  function toLocal(usd: number): string | undefined {
    if (!rates || localCurrency === "USD") return undefined;
    const meta = CURRENCY_META[localCurrency];
    return `≈ ${meta.flag} ${formatLocal(convertUSD(usd, localCurrency, rates), localCurrency)}`;
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "18px", padding: "16px" }}>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-55)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
        🎯 Savings Calculator
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        <CalcInput label="Balance ($)" value={balance} onChange={setBalance} placeholder="0" />
        <CalcInput label="Monthly (+$)" value={monthly} onChange={setMonthly} placeholder="50" />
        <CalcInput label="Goal ($)" value={target} onChange={setTarget} placeholder="500" />
        <CalcInput label="APY (%)" value={apy} onChange={setApy} placeholder="5" />
      </div>

      {months === null && (
        <div style={{ fontSize: "11px", color: "var(--ink-40)", textAlign: "center" }}>
          Enter your goal amount to see how long it takes
        </div>
      )}

      {months === 0 && (
        <div style={{ background: "var(--green-soft)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--green-ink)" }}>Already reached!</div>
          <div style={{ fontSize: "11px", color: "var(--green-ink)", marginTop: "2px", opacity: 0.75 }}>
            Your balance meets or exceeds the goal.
          </div>
        </div>
      )}

      {months === -1 && (
        <div style={{ background: "var(--coral-soft)", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--coral-ink)" }}>
            Goal unreachable — add a monthly deposit or increase APY.
          </div>
        </div>
      )}

      {months !== null && months > 0 && months !== -1 && (
        <div style={{ background: "var(--bg-soft)", borderRadius: "12px", padding: "12px", display: "grid", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "11px", color: "var(--ink-55)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Time to goal
            </span>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
              {formatDuration(months)}
            </span>
          </div>

          <div style={{ height: "1px", background: "var(--line)" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--ink-40)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Goal</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-mono)" }}>${t.toFixed(2)}</div>
              {toLocal(t) && <div style={{ fontSize: "10px", color: "var(--ink-40)" }}>{toLocal(t)}</div>}
            </div>
            {interestGained !== null && interestGained > 0.005 && (
              <div>
                <div style={{ fontSize: "10px", color: "var(--ink-40)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Interest earned</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--green-ink)", fontFamily: "var(--font-mono)" }}>
                  +${interestGained.toFixed(2)}
                </div>
                {toLocal(interestGained) && <div style={{ fontSize: "10px", color: "var(--ink-40)" }}>{toLocal(interestGained)}</div>}
              </div>
            )}
          </div>

          {/* Simple progress bar showing how far along you are */}
          {b > 0 && (
            <div>
              <div style={{ height: "6px", borderRadius: "3px", background: "var(--line)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(100, (b / t) * 100)}%`,
                  background: "var(--green)",
                  borderRadius: "3px",
                  transition: "width 0.5s ease",
                }} />
              </div>
              <div style={{ fontSize: "10px", color: "var(--ink-40)", marginTop: "3px" }}>
                {((b / t) * 100).toFixed(1)}% saved already
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import type { LocalCurrency } from "./currency";

export type FxAlertDirection = "above" | "below";

export type FxAlert = {
  id: string;
  currency: LocalCurrency;
  targetRate: number;
  direction: FxAlertDirection;
  enabled: boolean;
  createdAt: string;
};

const KEY = "akili_fx_alerts_v1";

/** Returns all stored FX rate alerts from localStorage. */
export function getFxAlerts(): FxAlert[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as FxAlert[]; }
  catch { return []; }
}

function save(alerts: FxAlert[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(alerts)); } catch { /* ignore */ }
}

/** Creates a new FX rate alert, persists it, and returns the saved record. */
export function addFxAlert(data: Omit<FxAlert, "id" | "createdAt">): FxAlert {
  const alert: FxAlert = { ...data, id: `${Date.now()}`, createdAt: new Date().toISOString() };
  save([...getFxAlerts(), alert]);
  return alert;
}

/** Deletes an FX alert by id. */
export function removeFxAlert(id: string): void {
  save(getFxAlerts().filter(a => a.id !== id));
}

/** Toggles the enabled state of an FX alert by id. */
export function toggleFxAlert(id: string): void {
  save(getFxAlerts().map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
}

/** Returns alerts whose target rate has been crossed by the current rates. */
export function checkTriggeredFxAlerts(rates: Record<string, number>): FxAlert[] {
  return getFxAlerts().filter(a => {
    if (!a.enabled) return false;
    const rate = rates[a.currency];
    if (!rate) return false;
    return a.direction === "above" ? rate >= a.targetRate : rate <= a.targetRate;
  });
}

// ── G$ claim alert ────────────────────────────────────────────────────────────

const GD_ALERT_KEY = "akili_gd_claim_alert_v1";

type GDClaimAlertState = {
  dismissedAt: string | null;  // ISO timestamp of last dismissal
};

function getGDAlertState(): GDClaimAlertState {
  try { return JSON.parse(localStorage.getItem(GD_ALERT_KEY) ?? "{}") as GDClaimAlertState; }
  catch { return { dismissedAt: null }; }
}

/** Returns true if the G$ claim banner should be shown (not dismissed today). */
export function shouldShowGDClaimAlert(): boolean {
  const state = getGDAlertState();
  if (!state.dismissedAt) return true;
  const dismissedDay = state.dismissedAt.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return dismissedDay !== today;
}

/** Dismiss the G$ claim banner for today. */
export function dismissGDClaimAlert(): void {
  try {
    localStorage.setItem(GD_ALERT_KEY, JSON.stringify({ dismissedAt: new Date().toISOString() }));
  } catch { /* ignore */ }
}

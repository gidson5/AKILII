"use client";

export type AlertPeriod = "daily" | "weekly" | "monthly" | "quarterly";
export type RuleType = "spending_cap" | "savings_goal" | "yield_goal";

export type AlertRule = {
  id: string;
  type: RuleType;
  period: AlertPeriod | undefined;
  amount: number;
  label: string;
  enabled: boolean;
};

const RULES_KEY = "akili_alert_rules_v2";
const DISMISSED_KEY = "akili_alert_dismissed_date";
const ALERT_CACHE_KEY = "akili_alert_check_cache";

// ── Rule storage ──────────────────────────────────────────────────────────────

export function getRules(): AlertRule[] {
  try { return JSON.parse(localStorage.getItem(RULES_KEY) ?? "[]"); }
  catch { return []; }
}

export function saveRules(rules: AlertRule[]): void {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

export function addRule(rule: Omit<AlertRule, "id">): AlertRule {
  const full: AlertRule = { ...rule, id: `${Date.now()}` };
  saveRules([...getRules(), full]);
  return full;
}

export function removeRule(id: string): void {
  saveRules(getRules().filter(r => r.id !== id));
}

export function toggleRule(id: string): void {
  saveRules(getRules().map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
}

// ── Dismiss state (once per day) ──────────────────────────────────────────────

export function isDismissedToday(): boolean {
  try { return localStorage.getItem(DISMISSED_KEY) === today(); }
  catch { return false; }
}

export function dismissAlerts(): void {
  try { localStorage.setItem(DISMISSED_KEY, today()); }
  catch { /* ignore */ }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Spending check helpers ────────────────────────────────────────────────────

export type SpendSnapshot = {
  daily: number;
  weekly: number;
  monthly: number;
  quarterly: number;
  totalBalance: number;    // sum of stablecoin balances (for savings goal)
  yieldEarned: number;     // cumulative interest from MiniPay Boost
  cachedAt: string;
};

export function getCachedSnapshot(): SpendSnapshot | null {
  try {
    const raw = sessionStorage.getItem(ALERT_CACHE_KEY);
    if (!raw) return null;
    const snap: SpendSnapshot = JSON.parse(raw);
    // invalidate if older than 30 min
    if (Date.now() - new Date(snap.cachedAt).getTime() > 30 * 60 * 1000) return null;
    return snap;
  } catch { return null; }
}

export function setCachedSnapshot(snap: SpendSnapshot): void {
  try { sessionStorage.setItem(ALERT_CACHE_KEY, JSON.stringify(snap)); }
  catch { /* ignore */ }
}

export function checkTriggeredRules(rules: AlertRule[], snap: SpendSnapshot): AlertRule[] {
  return rules.filter(r => {
    if (!r.enabled) return false;
    if (r.type === "spending_cap" && r.period) {
      return snap[r.period] >= r.amount;
    }
    if (r.type === "savings_goal") {
      return snap.totalBalance >= r.amount;
    }
    if (r.type === "yield_goal") {
      return snap.yieldEarned >= r.amount;
    }
    return false;
  });
}

export const PERIOD_LABELS: Record<AlertPeriod, string> = {
  daily: "Today",
  weekly: "This week",
  monthly: "This month",
  quarterly: "This quarter",
};

// ── Category limits ───────────────────────────────────────────────────────────

const CATEGORY_LIMITS_KEY = "akili_category_limits_v1";

export type CategoryLimits = Record<string, number>;

export function getCategoryLimits(): CategoryLimits {
  try { return JSON.parse(localStorage.getItem(CATEGORY_LIMITS_KEY) ?? "{}"); }
  catch { return {}; }
}

export function setCategoryLimit(category: string, limit: number): void {
  const limits = getCategoryLimits();
  limits[category] = limit;
  localStorage.setItem(CATEGORY_LIMITS_KEY, JSON.stringify(limits));
}

export function clearCategoryLimit(category: string): void {
  const limits = getCategoryLimits();
  delete limits[category];
  localStorage.setItem(CATEGORY_LIMITS_KEY, JSON.stringify(limits));
}

export const FUNNY_QUOTES = [
  "Your wallet called. It needs a hug. 🫂",
  "Money flies when you're having fun. Yours just sprouted wings. 🪽",
  "Plot twist: the real treasure was the money we didn't spend. 🏴‍☠️",
  "Your future self sent a strongly-worded letter. 📬",
  "At this rate, you're single-handedly keeping the economy alive. 💪",
  "Congratulations! You've sponsored someone else's business goals. 🎊",
  "Easy come, easy go. Mostly go, though. 🌬️",
  "The bank account has spoken. The discussion is over. 🔨",
  "Your spending is so fast, it lapped your income. 🏎️",
  "Budget: a mathematical confirmation of your suspicions. 📊",
];

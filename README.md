# Akili — AI Financial Intelligence for MiniPay

> *Akili* is the Swahili word for intelligence and wisdom.

Akili is an AI-powered financial copilot built for MiniPay users across Africa. It connects directly to your Celo wallet, reads your on-chain transaction history, and gives you clear, honest, actionable insights about your money — in plain language, no jargon, no spreadsheets required.

---

## The Problem

Over 3 million people in Nigeria, Kenya, and Ghana use MiniPay to hold and move stablecoins daily. But most of them have no visibility into their own financial behaviour. They can see individual transactions, but they cannot answer basic questions like:

- *Where did my money actually go this month?*
- *Am I spending more than I earn?*
- *Are there any suspicious interactions on my wallet?*
- *What would a realistic savings plan look like for me?*

Traditional banking apps offer dashboards and analytics — MiniPay users have had nothing equivalent. Akili closes that gap.

---

## What Akili Does

Akili reads your Celo wallet's transaction history via Celoscan and uses GPT-4o-mini to generate six types of financial intelligence:

| Report | What it tells you |
|---|---|
| **Spending Advice** | 3–5 specific, data-backed tips to cut waste and save more |
| **Account Summary** | A friendly bank-statement-style summary of money in vs. out |
| **Wallet Audit** | A 0–100 health score across spending discipline, fee efficiency, and risk |
| **Wallet Statement** | A formal, downloadable record of all transactions — useful as proof of financial activity |
| **Monthly Plan** | A personalised budget built from your actual income and spending patterns |
| **Financial Health** | A multi-dimensional scorecard covering savings rate, activity health, and fee efficiency |

Beyond reports, Akili has a **live chat interface** — you can ask it anything about your wallet in natural language and it answers using your real on-chain data.

---

## Use Case: Amara in Lagos

Amara receives her freelance payments in USDC on Celo via MiniPay. She sends money home weekly, pays for goods with stablecoins, and occasionally interacts with DeFi protocols. At the end of the month she has no idea where most of it went.

She opens Akili, connects her wallet, and within seconds gets:

1. A **Spending Advice** report showing she's paid $4.80 in gas fees on micro-transactions that could have been batched — saving her ~$3/month
2. An **Account Summary** revealing she received $340 USDC but sent $310 — a thin $30 buffer with no savings
3. A **Wallet Audit** scoring her 54/100 — flagging two unknown contract interactions she didn't recognise
4. A **Monthly Plan** suggesting she set aside $40/month automatically before spending, based on her average monthly income
5. A downloadable **Wallet Statement** she can show as proof of income to a micro-lender

None of this required a bank account, a credit bureau, or a financial advisor. Just her wallet.

---

## Why Akili Is a Great Agent

### 1. Real On-Chain Context, Not Generic Advice

Most AI financial tools give generic advice based on categories you manually enter. Akili reads your actual blockchain transactions — real amounts, real counterparties, real dates. The advice is specific to *you*, not a template.

### 2. Designed for the Right Users

Akili is built specifically for MiniPay users in sub-Saharan Africa. The system prompt, tone, and report formats are calibrated for people holding USDC and USDT on Celo, sending remittances, and operating in dollar-equivalent economies without traditional banking infrastructure.

### 3. On-Chain Guardrails (PolicyRouter)

Akili's recommendation engine is backed by a deployed **PolicyRouter** smart contract on Celo mainnet (`0x0c0345b3DFBFFD4300255F9DB933A4751cCD2124`). The contract enforces:

- **Venue policies** — each action type has a configured executor, max amount, and accepted tokens
- **Cooldown periods** — prevents repeated execution within a time window
- **Quote expiry** — recommendations expire after a configurable window to prevent stale data from driving actions
- **Slippage protection** — a `maxSlippageBps` guard on all non-liquid actions
- **User risk scores** — certain high-risk venues are only unlocked for users with an appropriate risk profile
- **Recipient matching** — funds can only be routed to the verified user address

This means Akili is not just a chatbot — it has a trust layer that enforces policy before any financial action is executed.

### 4. Registered On-Chain Agent Identity (ERC-8004)

Akili is registered as a verifiable on-chain agent via the **ERC-8004** identity registry on Celo mainnet:

- **Registry:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- **Agent URI:** `https://akili.app/agent.json`
- **Registration tx:** [`0xda007d57...`](https://celoscan.io/tx/0xda007d57e9c8f7ac65cc49e86175ea363ac42f2a8df30fb5c57cabe599c96d7a)

This gives Akili a cryptographically verifiable identity on-chain — other protocols, wallets, and agent frameworks can discover and verify Akili's capabilities without trusting a centralised registry.

### 5. x402 Micropayment Support (thirdweb)

Akili implements the **x402 payment protocol** using the thirdweb SDK. When configured, the `/api/recommend` endpoint requires a **0.01 USDC payment on Celo** before returning a report. This enables:

- Permissionless API monetisation with no subscription or API keys needed on the client
- Machine-to-machine payment flows where other agents can pay Akili for analysis
- A sustainable micropayment model suited to low-value, high-frequency use in emerging markets

### 6. Deep Research via Linkup

Akili augments wallet analysis with live external research using the **Linkup API** — pulling in DeFi protocol context, token risk signals, or broader market information to enrich its reports beyond raw transaction data.

### 7. Works Inside MiniPay

The entire frontend is a Next.js 15 Progressive Web App designed for MiniPay's in-app browser. It auto-detects and connects the MiniPay wallet provider, handles safe-area insets for mobile, and renders cleanly on a 390px screen. No separate wallet connection flow required.

---

## Architecture

```
apps/
  miniapp/          Next.js 15 App Router — MiniPay PWA frontend
    app/
      copilot/      AI chat + insights UI (charts, download, tab switching)
      api/
        chat/       Streaming chat endpoint
        insights/   Wallet analysis endpoint
        recommend/  x402-gated recommendation endpoint
        wallet/     Celoscan transaction fetcher
    lib/
      x402.ts            thirdweb x402 payment integration
      celo-transactions  On-chain tx parsing and labelling
      linkup.ts          Linkup deep research client

packages/
  agents/           GPT-4o-mini wallet analyst — reports + chat
  celo/             Venue adapters, policy router bindings, token config
  shared/           Zod schemas, types, constants
  contracts/        Solidity — PolicyRouter.sol
    scripts/
      deploy.ts            Hardhat deploy to Celo mainnet
      register-erc8004.ts  Viem-based ERC-8004 agent registration
```

---

## Deployed Contracts

| Contract | Address | Network |
|---|---|---|
| PolicyRouter | `0x0c0345b3DFBFFD4300255F9DB933A4751cCD2124` | Celo Mainnet |
| ERC-8004 Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | Celo Mainnet |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A MiniPay wallet or any EIP-1193 wallet on Celo

### Install

```bash
git clone https://github.com/gidson5/minipay-yield-decision-Agent.git
cd minipay-yield-decision-Agent
pnpm install
```

### Environment

Copy `.env.example` to `.env.local` in the repo root and fill in:

```bash
# Required
OPENAI_API_KEY=sk-...
LINKUP_API_KEY=...

# Optional — enable x402 micropayment gating
THIRDWEB_SECRET_KEY=...
AGENT_PAYMENT_RECIPIENT=0x...   # wallet to receive 0.01 USDC per analysis

# For contract deployment / ERC-8004 re-registration
DEPLOYER_PRIVATE_KEY=...        # without 0x prefix
AGENT_URI=https://your-domain/agent.json
```

### Run locally

```bash
pnpm dev
```

The MiniPay frontend runs at `http://localhost:3000`.

### Deploy contracts

```bash
# Deploy PolicyRouter to Celo mainnet
DEPLOYER_PRIVATE_KEY=... pnpm --filter @yield-copilot/contracts run deploy

# Register agent with ERC-8004
DEPLOYER_PRIVATE_KEY=... pnpm --filter @yield-copilot/contracts run register:agent
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, App Router, TypeScript |
| AI | OpenAI GPT-4o-mini |
| Research | Linkup Deep Research API |
| Blockchain | Celo Mainnet, Viem, Celoscan API |
| Payments | thirdweb x402 (0.01 USDC / request) |
| Smart Contracts | Solidity 0.8.24, Hardhat |
| Agent Identity | ERC-8004 on-chain registry |
| Package Manager | pnpm workspaces |

---

## License

MIT

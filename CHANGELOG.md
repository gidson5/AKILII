# Changelog

All notable changes to Akili are documented here.

## [1.0.0] — 2026-05-19

### Added
- AI financial copilot (GPT-4o-mini) with wallet analysis, spending advice, audit, and statement reports
- Live chat interface with on-chain wallet context
- SVG donut and bar charts in the Insights tab
- Downloadable wallet statement (plain text)
- MiniPay wallet auto-connect (no manual connect needed)
- PolicyRouter smart contract deployed to Celo mainnet (`0x0c0345b3DFBFFD4300255F9DB933A4751cCD2124`)
- ERC-8004 on-chain agent identity registration
- thirdweb x402 micropayment support (0.01 USDC per analysis)
- Linkup deep research integration for enriched AI reports
- Custom 404 page
- PWA manifest for installability
- Open Graph and Twitter meta tags
- Security headers (X-Frame-Options, XSS protection)
- Health check endpoint at `/api/health`
- GitHub Actions CI (typecheck + lint)
- CIP-64 fee abstraction adapter addresses for USDC and USDT

### Changed
- Renamed from "Yield Copilot" to "Akili"
- Replaced yield routing focus with AI financial intelligence
- Removed USDm from token scope (USDC and USDT only)
- Renamed "Gas fee" to "Network fee" throughout (MiniPay listing requirement)
- Bottom navigation reduced to 4 items: Home, Akili, Insights, Alerts

### Fixed
- Bottom nav active state with query params (`?tab=insights`)
- Chat input positioning above bottom nav on mobile
- TypeScript `exactOptionalPropertyTypes` errors in copilot page

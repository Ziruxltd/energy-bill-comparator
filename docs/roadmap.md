# Roadmap

## v1 — Electricity

- [x] Monorepo, tooling and basic CI (lint, format, typecheck and tests on GitHub Actions)
- [x] Shared schema (discriminated union) + `EnergyCalculator` interface
- [x] Electricity schema and calculation engine with tests (start by recalculating a real bill with a known total) — tariff prices in `data/tariffs/` are still placeholders
- [x] Energy type detection + electricity extraction with Claude + total cross-check
- [ ] 20–30 redacted electricity bills with ground truth + `run-evals.ts`
- [ ] Netlify function connecting extraction and calculation
- [ ] Frontend: upload, ranking, breakdown, estimate disclaimer (mobile first)
- [ ] Deploy to Netlify
- [ ] README with architecture, decisions and eval results table

## v2 — Gas

- [ ] Gas schema, calculator, prompt, tariffs and evals following the electricity module
- [ ] Gas breakdown component in the frontend

## Later ideas

- Regulated tariffs (PVPC, TUR) using public data
- Automatic tariff updates
- Dual-fuel bills, self-consumption/surplus, indexed tariffs

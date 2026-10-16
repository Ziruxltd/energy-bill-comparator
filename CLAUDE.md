# CLAUDE.md — Energy Bill Comparator (Spain)

> Context for Claude Code. Read it in full before every session.

## What this project is

A public web app where users upload their Spanish energy bill (PDF) and see how much they would pay with other Spanish energy retailers, ranked by estimated annual savings. Built for **multiple energy types** (electricity first, then gas).

This is a **portfolio project**: besides working, it must demonstrate solid AI engineering (structured extraction, measurable evals, privacy) and be well documented.

**Author:** Antonio, frontend developer (Vue, React, TypeScript). He wants to **understand every decision**: whenever you do something non-obvious, briefly explain why. Don't hand him "magic" solutions he couldn't defend in a job interview.

## Related docs

- `docs/architecture.md` — folder structure, data schema, request flow, multi-energy design. **Read it before creating, moving or renaming files, or changing a schema.**
- `docs/roadmap.md` — what's done and what's next. Update the checkboxes when a step is finished.
- `docs/v1-plan.md` — v1 phases: files each phase creates, what "done" means, decisions and risks. **Read it before starting a phase.**
- `docs/decisions/` — ADRs for important decisions.

## Golden rule

**The LLM extracts, the code calculates.**

- Claude only reads the bill and returns structured data that matches the `ExtractedBill` schema.
- All money calculations are done by deterministic code in `packages/core`, with tests.
- Never ask the model to calculate, compare tariffs or estimate savings.

## Multiple energy types

One module per energy type (`electricity/`, `gas/`) behind a common `EnergyCalculator` interface. Adding a new energy type means adding folders and registering it — never editing another type's code. Details in `docs/architecture.md`.

## v1 scope

- **Electricity only**: residential, 2.0TD, mainland Spain. Gas folders exist as placeholders.
- Fixed-price tariffs from: Iberdrola, Endesa, Naturgy, TotalEnergies, Repsol, Holaluz, Octopus Energy. (EDP dropped: no household offer since selling that business to TotalEnergies in 2020.)
- Out of scope: gas (v2), PVPC/TUR, self-consumption, indexed tariffs, automatic tariff updates, dual-fuel bills.

## Stack

- **Monorepo** with pnpm workspaces.
- **Frontend:** Vue 3 (Composition API, `<script setup>`), strict TypeScript, Vite 8 (Rolldown). Don't propose alternative build tools.
- **Backend:** Netlify Functions (TypeScript). One function: `analyze-bill`.
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`), extraction via structured outputs (`messages.parse` + `zodOutputFormat`) from the Zod schema. One model per step, see "Cost control".
- **Validation:** Zod (same schema validates LLM output and types the frontend).
- **Money:** `decimal.js`. Never floating-point `number` for amounts.
- **Tests:** Vitest. **Lint/format:** ESLint + Prettier.

## Privacy (non-negotiable)

- PDFs are **never stored**: processed in memory and discarded.
- Never log bill contents or personal data. Use `redact.ts` before any logging.
- The API key exists only on the server. Never in the frontend.
- `evals/bills/` is in `.gitignore`. Redact every bill PDF by hand before adding it to the evals (`redact.ts` only masks strings in logs, it can't redact PDFs). Ground-truth JSON never contains DNI, CUPS, name, address or IBAN.

## Tax rates and tariffs

- Never write tax rates or prices from memory: they live in each energy type's `tax-rates.ts` and in `data/tariffs/`, with source and date. If unsure a value is current, leave `TODO: verify` and tell me.
- Results are always shown as an **estimate**, with the date of the tariff data.

## Cost control

The Claude API is paid per use with the author's own key.

- Validate before any AI call: PDF magic bytes, size ≤ 4 MB, token count ≤ limit (free `countTokens`). Reject early, never "try anyway".
- Rate limit `analyze-bill` per IP with Netlify's native `config.rateLimit` (not in-memory counters: function instances don't share memory).
- One model per step, from env vars read only in `packages/extraction/src/config.ts`: `ANTHROPIC_MODEL_DETECTION` (default `claude-haiku-5-5`) and `ANTHROPIC_MODEL_EXTRACTION` (default `claude-sonnet-5-5`).
- No dynamic or automatic model switching anywhere. No fallback, and no retry on a different or more expensive model. A retry uses the same model.
- Compare models only through evals: `pnpm evals --model <id>` overrides the extraction model for that run without touching production config. Every report includes accuracy and estimated cost per bill.
- Demo mode (`DEMO_MODE` / demo button) uses pre-extracted samples from `data/samples/` and never calls Claude, but still runs `packages/core`.
- Log token usage (`response.usage`) per request, never bill contents.
- Evals cost money: run them deliberately, never in CI. Note the cost of each run in its results file.
- A monthly spend limit is set in the Anthropic Console (owner: Antonio).

## Tooling

Conventions are enforced by tools; this file only lists what tools can't check.

- ESLint (flat config): typescript-eslint, `naming-convention`, `no-explicit-any` = error, Vue plugin.
- Prettier formats; ESLint doesn't check formatting (`eslint-config-prettier`).
- TypeScript strict everywhere; `pnpm typecheck` (tsc + vue-tsc).
- Git hooks (lefthook): pre-commit lints/formats staged files; commit-msg runs commitlint (Conventional Commits).
- CI (GitHub Actions) runs lint, format check, typecheck and tests on every push/PR. It's the safety net if hooks are skipped (`--no-verify`).
- Not enforceable by tools: English naming, small pure functions, explaining decisions.

## Conventions

- **Everything in English** (code, comments, commits, docs). Spanish only for untranslatable domain terms (`2.0TD`, `RL.1`, `CUPS`, `PVPC`, `TUR`, `p1`/`p2`/`p3`).
- UI copy in Spanish, in `apps/web/src/i18n/`.
- Strict TypeScript. No `any` without a justification.
- Small, pure calculation functions, each with its own test.
- Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`), small and frequent.

## How to work in this repo

- Before a large change, propose a short plan and wait for confirmation.
- Don't add new dependencies without asking.
- After every change in `packages/core`, run the tests.
- After changing an extraction prompt or schema, run the evals and compare with the previous result.
- Keep `docs/architecture.md` in sync when the structure or schema changes.
- If a decision matters for the portfolio, suggest an ADR in `docs/decisions/`.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Frontend + functions locally (netlify dev)
pnpm test             # Unit tests for all packages
pnpm lint             # ESLint
pnpm format           # Prettier (format:check in CI)
pnpm typecheck        # tsc + vue-tsc across all packages
pnpm evals            # Run extraction evals (requires ANTHROPIC_API_KEY; costs money)
```

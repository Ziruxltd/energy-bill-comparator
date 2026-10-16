# Architecture

## Designing for multiple energy types

- `ExtractedBill` is a **discriminated union** on `energyType` (`"electricity"` | `"gas"`). Each energy type has its own schema with its own fields.
- Calculation logic lives in one folder per energy type, behind a **common interface** (e.g. `EnergyCalculator` with `calculateBill(bill, tariff)`). `compare.ts` only talks to that interface.
- Tariffs, prompts, tax rates, UI breakdown components and evals are also split by energy type.
- Adding a new energy type means adding new folders and registering it — not editing the existing ones.
- Shared concepts (billing period, retailer, VAT, discounts, money helpers) go in `shared/`.

## Request flow

```
PDF upload (web)
  -> analyze-bill (Netlify function)
    -> validation: PDF magic bytes, size <= 4 MB, token count (before any paid call)
    -> extraction: detect energy type (cheap model, also rejects non-bills) -> extract with Claude -> validate with Zod
    -> core: pick calculator by energyType -> recalculate bill with each tariff -> rank
  -> result (ranking + breakdown + confidence flags) back to the web
```

## Folder structure

```
energy-bill-comparator/
├── CLAUDE.md
├── README.md                     # What it is, demo link, architecture, eval results
├── package.json                  # Root scripts
├── pnpm-workspace.yaml
├── netlify.toml
├── tsconfig.base.json            # Strict options shared by every package
├── tsconfig.json                 # Typechecks netlify/ and evals/
├── eslint.config.js              # Flat config
├── prettier.config.js
├── commitlint.config.js
├── lefthook.yml                  # Git hooks: pre-commit, commit-msg
├── vitest.config.ts              # Test projects for every package
├── .github/workflows/ci.yml      # lint, format check, typecheck, tests
├── .env.example                  # ANTHROPIC_API_KEY, ANTHROPIC_MODEL_DETECTION, ANTHROPIC_MODEL_EXTRACTION, DEMO_MODE (no real values)
├── .gitignore                    # Includes .env and evals/bills/
│
├── apps/
│   └── web/                      # Vue 3 frontend
│       ├── index.html
│       ├── vite.config.ts
│       └── src/
│           ├── main.ts
│           ├── App.vue
│           ├── i18n/             # UI copy (Spanish first)
│           ├── views/            # UploadBillView, ResultsView
│           ├── components/
│           │   ├── shared/       # UploadDropzone, TariffRanking, EstimateDisclaimer
│           │   ├── electricity/  # ElectricityBillBreakdown
│           │   └── gas/          # (v2) GasBillBreakdown
│           ├── composables/      # useAnalyzeBill
│           └── services/         # api.ts (calls the Netlify function)
│
├── packages/
│   ├── core/                     # Pure domain logic. NO AI or network dependencies
│   │   ├── src/
│   │   │   ├── extracted-bill.ts # ExtractedBill union: the registry of energy types
│   │   │   ├── shared/
│   │   │   │   ├── schema.ts     # Zod: DecimalString, ConfidenceLevel, BillingPeriod, Discount, common fields
│   │   │   │   ├── money.ts      # decimal.js helpers, rounding rules
│   │   │   │   ├── vat.ts
│   │   │   │   └── calculator.ts # EnergyCalculator interface, BillBreakdown, CalculationResult
│   │   │   ├── electricity/
│   │   │   │   ├── schema.ts     # Zod: ElectricityBill, ElectricityTariffTerms, ElectricityTariff
│   │   │   │   ├── power.ts      # Power term (P1, P2)
│   │   │   │   ├── energy.ts     # Energy term (P1, P2, P3)
│   │   │   │   ├── taxes.ts      # Electricity tax (with its legal minimum)
│   │   │   │   ├── tax-rates.ts  # Current rates, with effective date and source
│   │   │   │   └── calculator.ts # Implements EnergyCalculator (line order, tax bases, extracted extras)
│   │   │   ├── gas/              # (v2) Same shape as electricity/
│   │   │   ├── compare.ts        # Picks the calculator by energyType, ranks tariffs, cross-checks the total
│   │   │   └── index.ts
│   │   └── test/
│   │       ├── electricity/
│   │       └── gas/
│   │
│   └── extraction/               # Everything that talks to Claude
│       ├── src/
│       │   ├── config.ts         # The only place that reads model env vars (with defaults)
│       │   ├── detect.ts         # Detects energy type of the uploaded bill (or "not a bill")
│       │   ├── electricity/
│       │   │   ├── prompt.ts     # Extraction instructions for electricity bills
│       │   │   └── output-schema.ts # Zod schema passed to structured outputs (zodOutputFormat)
│       │   ├── gas/              # (v2)
│       │   ├── extract.ts        # PDF -> ExtractedBill (detect -> extract -> validate, retries once)
│       │   └── redact.ts         # Masks DNI, CUPS, name, address, IBAN
│       └── test/
│
├── netlify/
│   └── functions/
│       └── analyze-bill.ts       # Receives PDF -> extraction -> core -> returns result
│
├── data/
│   └── tariffs/
│       ├── electricity/
│       │   └── 2026-10.json      # Current tariffs; each with source URL and date checked
│       └── gas/                  # (v2)
│
├── data/samples/                 # Pre-extracted ExtractedBill JSON for demo mode (no Claude call)
│
├── evals/
│   ├── bills/                    # Real, redacted PDFs. NOT committed to git
│   │   ├── electricity/
│   │   └── gas/
│   ├── ground-truth/             # Hand-labeled JSON for each bill (committed)
│   │   ├── electricity/
│   │   └── gas/
│   ├── run-evals.ts              # Extracts every bill and compares field by field (--model <id>)
│   └── results/                  # Reports by date and model (accuracy per field, cost per bill)
│
└── docs/
    ├── architecture.md           # This file
    ├── roadmap.md
    └── decisions/                # Short ADRs: 001-llm-extracts-code-calculates.md,
                                  # 002-one-module-per-energy-type.md, etc.
```

## Data schema (starting point)

Common fields (all energy types):

- `energyType`: `"electricity"` | `"gas"`
- `retailer`, `tariffName`
- `billingPeriod`: `startDate`, `endDate`, `days`
- `discounts[]` (`description`, `amountEur`), `totalAmountEur`
- `confidence`: an object with one fixed key per field group (`retailer`, `billingPeriod`, `prices`…), each `high` | `medium` | `low`, so the UI can warn per section. Fixed keys (not a free record) keep it typed and compatible with structured outputs.
- Fields not found: `null`, never invented. Every field except `energyType` is nullable (`discounts` is `[]` when there are none). The calculator, not the schema, decides whether there is enough data and returns `{ ok: false, missingFields }` otherwise.
- Dates: ISO `YYYY-MM-DD` (the model normalises Spanish `dd/mm/yyyy`).
- Money amounts and prices are **decimal strings** (e.g. `"0.123456"`), converted to `Decimal` in core. Never JSON numbers.

Electricity-specific (`ElectricityBill`):

- `contractedPowerKw`: `{ p1, p2 }`
- `consumptionKwh`: `{ p1, p2, p3 }`
- `prices`: `powerEurPerKwDay { p1, p2 }`, `energyEurPerKwh { p1, p2, p3 }`
- `socialBonusFinancingEur`: regulated, same for every retailer, so it's reused for every tariff
- `meterRentalEur`: charged by the distributor, reused for every tariff
- `otherServices[]` (`description`, `amountEur`): optional add-ons (maintenance, insurance…) before VAT, one per printed line; `[]` when there are none. The model lists them and the code sums them, so the LLM never adds numbers. Added to every tariff so totals match the bill; savings don't change.

Electricity bill line order (checked against a real 2.0TD bill): power p1, power p2, energy, −discounts, social bonus → electricity tax on that subtotal (never below 1 €/MWh) → meter rental, services → VAT on everything.

`EnergyCalculator` has two methods: `calculateBill(bill, tariff)` and `currentTariff(bill)`, which builds the tariff the bill was charged with from its extracted prices and discounts (null if a price is missing). The calculator only needs `ElectricityTariffTerms` (`prices`, `discounts`), so the bill's own tariff and a retailer offer go through the same code.

Tariff (`ElectricityTariff`, one entry in `data/tariffs/electricity/*.json`):

- `retailer`, `tariffName`, `energyType`, `accessTariff` (`"2.0TD"`)
- `prices`: `powerEurPerKwDay { p1, p2 }`, `energyEurPerKwh { p1, p2, p3 }` (decimal strings)
- `discounts`: always `[]` for offers; only the bill's own tariff carries the user's discounts
- `sourceUrl`, `checkedAt`, `validFrom`, `verified` (false while prices are placeholders), optional `notes`
- Prices are always the retailer's own page, without taxes, for a new customer contracting online in the first 12 months (first-year discounts included, the later price in `notes`), so the annual savings estimate covers the first year. Never comparison sites: they disagreed with each other and with the official pages. `validFrom` is the date the page states, or `checkedAt` if it states none.

Tariff JSON is imported by the Netlify function (bundled at deploy) and validated with the core Zod schema at module load. `packages/core` never reads files: it receives tariffs as arguments.

Gas-specific (`GasBill`, v2 — to be defined): access tariff (RL.1, RL.2…), consumption in kWh, fixed daily term, variable price per kWh, meter rental, hydrocarbons tax.

## Money rules

- `decimal.js` everywhere; amounts enter core as decimal strings.
- Each bill line is rounded to cents with `ROUND_HALF_UP` (`roundToCents`), as Spanish bills print them. The total is the sum of rounded lines. Intermediate math is never rounded.
- Electricity energy is **one** line: Σ kWh × price over p1–p3, rounded once (rounding per period was a cent off on a real bill). Power is one line per period, as bills print it.
- The rounding mode is passed on each call, not set in `decimal.js` global config, so no import can change it.

## Extraction cross-check

`compare.ts` recalculates the bill with its own tariff (`currentTariff`). If that total differs from `totalAmountEur` by more than 2% (`CROSS_CHECK_TOLERANCE`), the result is `mismatch` and the UI flags the extraction as uncertain. Savings are measured against the same recalculation (same rules on both sides), or the printed total when the bill's prices are missing. Annual savings = savings / days × 365.

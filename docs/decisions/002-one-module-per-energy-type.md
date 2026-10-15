# 002. One module per energy type

- Status: accepted
- Date: 2026-10-16

## Context

v1 handles electricity, v2 adds gas. The two have different fields (2.0TD periods vs RL.x access tariffs), taxes and price structures, but share concepts like billing period, discounts and VAT.

## Decision

- `ExtractedBill` is a Zod discriminated union on `energyType`, defined in `core/src/extracted-bill.ts`, which acts as the registry of energy types.
- Each energy type has its own folder (`electricity/`, `gas/`) with its schema, calculator, tax rates, prompts, tariffs, UI breakdown and evals.
- Calculators implement the shared `EnergyCalculator<TBill, TTariff>` interface; `compare.ts` only talks to that interface.
- Shared concepts live in `shared/`. `shared/` never imports from an energy type folder; the union lives outside `shared/` to avoid an import cycle.

## Alternatives considered

- One flat bill type with optional fields for every energy type: simpler at first, but every new type makes all fields optional and the compiler stops helping.
- A class hierarchy (`BaseCalculator`): adds inheritance coupling for no gain over an interface.

## Consequences

- Adding gas means adding a folder and registering it in two places (the union and the calculator registry), never editing electricity code.
- TypeScript narrows on `energyType`, so the frontend can pick the right breakdown component safely.
- Some duplication between energy types is accepted when it keeps them independent.

# 001. The LLM extracts, the code calculates

- Status: accepted
- Date: 2026-10-16

## Context

The app must tell users how much they would pay with other retailers. That needs two different skills: reading messy, retailer-specific PDF layouts, and doing exact money arithmetic with Spanish tariff and tax rules.

## Decision

Claude only reads the bill and returns data matching the `ExtractedBill` Zod schema. Every money calculation (recalculating the bill, comparing tariffs, estimating savings) is deterministic TypeScript in `packages/core`, using `decimal.js`, with a unit test per function.

## Alternatives considered

- Ask the model to compute the savings directly: one call, less code, but results are unverifiable, can't be unit tested, and can change between runs or model versions.
- Rule-based PDF parsing without an LLM: deterministic, but every retailer and layout change needs a new parser.

## Consequences

- Calculation bugs are caught by tests, and extraction quality is measured separately by evals. Each layer has its own quality signal.
- Recalculating the user's current bill from the extracted data and comparing it with the printed total gives a free cross-check on extraction.
- The extraction schema becomes the contract between the two layers, so changing it means running both tests and evals.

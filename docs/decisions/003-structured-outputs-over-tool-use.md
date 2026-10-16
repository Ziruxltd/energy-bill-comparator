# 003. Structured outputs for extraction, not tool use

- Status: accepted
- Date: 2026-10-15

## Context

Extraction must return JSON that matches the `ExtractedBill` Zod schema. The classic approach was a tool whose `input_schema` is the schema, with `tool_choice` forcing the call. Current models (Claude Opus 5.5, Sonnet 5.5) reject forced `tool_choice` (`any` / `tool`) with a 400, so tool use can no longer guarantee that the model returns the data.

## Decision

Use structured outputs: `client.messages.parse()` with `output_config.format = zodOutputFormat(schema)` from `@anthropic-ai/sdk/helpers/zod`. The response is constrained to the schema and parsed back into a typed object.

## Alternatives considered

- Strict tool (`strict: true`) with `tool_choice: auto`: valid arguments when called, but no guarantee of a call, so we would need a re-prompt path. Also needs a Zod to JSON Schema step.
- `zod-to-json-schema`: an extra dependency for something the SDK already does.

## Consequences

- No extra dependency; the Zod schema stays the single source of truth.
- Structured outputs support a subset of JSON Schema. The output schema stays plain (objects, strings, nullable, enums); refinements (decimal format, date order) run in a second, stricter Zod parse in code.

## Amendment (2026-10-17, phase 4)

- **`messages.create()` instead of `messages.parse()`**, still with `output_config.format = zodOutputFormat(schema)`. `parse()` throws as soon as the text isn't valid JSON, which is what a `refusal` or `max_tokens` response looks like, so `stop_reason` could never be checked (v1-plan R6). The code now checks `stop_reason` first, then validates with the core schema itself.
- **No separate output schema.** The SDK's `zodOutputFormat` already moves unsupported constraints (the decimal regex) into field descriptions, and refinements don't appear in JSON Schema. So core's `ElectricityBill` is sent as is, and the same schema runs the strict parse in code. A test checks that the conversion doesn't throw.

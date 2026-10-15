# 004. lefthook for git hooks

- Status: accepted
- Date: 2026-10-15

## Context

Conventions must be enforced before code reaches the repo: lint and format staged files on commit, and check the commit message format (Conventional Commits).

## Decision

lefthook, configured in `lefthook.yml`. Pre-commit runs ESLint and Prettier on staged files only (`{staged_files}`, `stage_fixed: true`); commit-msg runs commitlint. Typecheck and tests run in CI, not in hooks.

## Alternatives considered

- Husky + lint-staged: the most common combo, but two dependencies. Husky only installs hooks, so it needs lint-staged to filter staged files. lefthook does both.

## Consequences

- One dependency and one declarative config file.
- Hooks can be skipped with `--no-verify`, so CI runs the same checks as the final safety net.

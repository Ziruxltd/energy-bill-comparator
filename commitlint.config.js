/** @type {import("@commitlint/types").UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // CLAUDE.md types plus the ones tooling work needs
    "type-enum": [2, "always", ["feat", "fix", "test", "docs", "refactor", "chore", "ci", "build"]],
  },
};

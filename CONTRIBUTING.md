# Contributing

Thanks for your interest in contributing to `recipe-scrapers` 🙂

This project values correctness, stability, and restraint.  
Please read this document before submitting changes.

---

## Guiding Principles

We prioritize:

- Correctness over cleverness
- Stability over novelty
- Predictable APIs over experimentation
- Incremental improvements over rewrites

This is a **library**, not a framework or application.

---

## Before Opening a PR

For non-trivial changes, open an issue first.

Examples of changes that require prior discussion:

- Validation library replacements
- HTML parsing engine swaps
- Dependency model changes (peer vs direct)
- Public API redesign
- Large refactors
- Tooling/runtime coupling changes

Preference-driven rewrites are unlikely to be accepted.

---

## Pull Request Expectations

PRs should be:

- Focused and minimal
- Clearly motivated
- Behaviorally safe
- Easy to review

Include:

- Clear rationale
- Tradeoff discussion (when applicable)
- Tests covering behavioral changes
- Migration notes (for breaking changes)

Avoid mixing unrelated concerns.

---

## Performance and Bundle Size

CI reports both on every PR:

- **Parse speed:** CodSpeed runs the benchmarks in `bench/` and comments on the PR when one changes. `bun run bench` runs them locally; local timings are noisy, so only compare runs from the same machine.
- **Bundle size:** the `bundle-size` job summary shows each entry's change from the base branch. The job fails when an entry's gzip size exceeds its budget in `bundle-size-budgets.json`. If the growth is justified, run `bun run build && bun run size --update-budgets` and explain it in the PR.

---

## Dependency Policy

Dependencies must have clear justification.

We avoid:

- Library churn without measurable benefit
- Preference-driven replacements
- Unnecessary abstraction layers

General guidance:

**Direct dependencies**  
Used when required for core functionality.

**Peer dependencies**  
Used when version skew, duplication, or API surface concerns apply.

**Tooling dependencies**  
Typically non-breaking unless consumer behavior is affected.

---

## Breaking Changes

Breaking changes are allowed but deliberate.

Requirements:

- Explicit justification
- Migration guidance
- SemVer major release

Avoid breaking changes driven purely by style or preference.

---

## Refactors

Refactors must provide tangible benefit:

- Improved correctness
- Reduced complexity
- Performance improvements
- Maintainability gains

Purely stylistic refactors are discouraged.

Large refactors should be discussed first.

---

## AI-Assisted Contributions

AI tooling is permitted.

However:

- PRs must include human-authored rationale
- Behavioral impacts must be explained
- Tests are required for changed behavior

Large AI-generated rewrites without justification may be rejected.

---

## Code Style

Follow existing project conventions.

Avoid introducing:

- New architectural patterns without discussion
- Unnecessary abstractions
- Preference-driven stylistic changes

Consistency > personal style.

---

## Commit Guidelines

Commits should be:

- Small and logically scoped
- Descriptive
- Easy to reason about
- Prefixed using Conventional Commits (`feat`, `fix`, `chore`, `docs`, etc.)

Release automation uses commit types to determine SemVer bumps and generate changelog entries.
Use `!` or a `BREAKING CHANGE:` footer for breaking changes.

Example:

```txt
fix(parser): handle missing schema fields
feat(site): add support for example.com
refactor(core): simplify extraction pipeline
```

---

## Review Philosophy

Reviews focus on:

- Correctness
- API stability
- Complexity impact
- Ecosystem coherence

Not personal preference.

---

## When Contributions May Be Rejected

Changes may be declined if they:

- Introduce unnecessary complexity
- Cause ecosystem churn
- Replace stable libraries without benefit
- Break API contracts without justification
- Reflect preference rather than improvement

---

## Contribution Tone

Be constructive, respectful, and pragmatic.

Disagreements are normal.  
Technical clarity wins over opinion.

---

Thanks for helping improve the project 👍

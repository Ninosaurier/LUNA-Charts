# Contributing to LUNA Charts

Thank you for considering a contribution to LUNA Charts! This document explains how the project is governed, what's expected of a contribution, and how to get your change through review.

Before contributing, please also read our [Code of Conduct](./.github/CODE_OF_CONDUCT.md).

## Project Status

LUNA Charts is currently in its **groundwork phase** — foundational architecture, tooling, and testing infrastructure are being established before chart components are built out. Check the [Roadmap](./docs/src/content/docs/getting-started/roadmap.mdx) to see what's currently in scope.

## How the Project Is Governed

LUNA Charts balances open community contribution with a documented architecture. In short:

- **The architecture is the authoritative source for implementation decisions** — it's documented under [`docs/.../architecture/adm`](./docs/src/content/docs/architecture/adm) (Architecture Development Method) and [`docs/.../architecture/adr`](./docs/src/content/docs/architecture/adr) (Architecture Decision Records)
- **Contributions are reviewed on three levels**: automated checks (types, linting, tests, accessibility), architectural compliance (does it fit the documented architecture?), and general project quality (readability, maintainability, documentation)
- **A Pull Request can be rejected even if all automated checks pass** — for example, if it introduces an unnecessary public API change, bypasses accessibility mechanisms, or conflicts with a documented architectural decision
- Community members can propose architectural changes, but such changes only become official once the relevant ADR/ADM documentation has been updated to reflect them (see [Architecture Change Management](./docs/src/content/docs/architecture/adm/architecture-change-management.mdx))

If you're planning a larger change, especially one that touches the public API, rendering approach, or accessibility behavior, please open an issue or discussion first so it can be reviewed against the architecture before you invest time in an implementation.

## Getting Started

1. Fork the repository and clone your fork
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Requirements: Node.js `>= 22.0.0`, pnpm `11.11.0` (via Corepack), and Docker (for component/browser tests)

## Making a Change

1. Create a branch from `main` with a descriptive name (e.g. `fix/axis-label-overflow`, `docs/update-technology-architecture`)
2. Make your change
3. Run the checks locally before opening a PR:

   ```bash
   pnpm lint
   pnpm test:unit
   pnpm test:component   # runs inside a Docker/Playwright container
   pnpm test             # runs both of the above
   ```
  
4. If your change affects published package behavior (bug fix, feature, breaking change), add a changeset:

   ```bash
   pnpm changeset
   ```

   Documentation-only or internal tooling changes generally don't need a changeset — if you're unsure, mention it in your PR description and a maintainer will advise.

## Pull Request Guidelines

- Keep PRs focused on a single concern where possible — smaller PRs are easier to review against the architecture
- Describe **what** changed and **why**, not just what the diff shows
- If your change affects accessibility behavior, explain how it was verified (e.g. which axe-core checks or manual screen-reader testing was done)
- If your change touches an area covered by an existing ADR, reference it and note whether the ADR needs a corresponding update
- Automated testing (unit, accessibility, linting) must pass before a PR can be merged

## Documentation Changes

Documentation lives in `docs/` (Starlight) and is a first-class contribution — fixing unclear wording, expanding examples, or correcting an outdated ADR/ADM page is just as valuable as a code change.

If your code change makes a documented architectural statement incorrect (for example, changing a technology choice or the repository structure), please update the relevant ADR/ADM page in the same PR, including a short **Change Log** entry at the end of that document explaining what changed and why. Keeping documentation in sync with implementation is part of the review criteria described above.

## Reporting Bugs and Suggesting Features

Please open an issue with:

- A clear description of the problem or suggestion
- Steps to reproduce (for bugs), including browser/OS if relevant to rendering or accessibility
- What you expected to happen vs. what actually happened

## Questions

If anything here is unclear, feel free to open a discussion or issue — improving this guide based on real contributor questions is welcome too.

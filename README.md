# LUNA Charts

LUNA Charts is a reusable, developer-friendly charting library designed to make accessible, WCAG-oriented data visualization the default rather than an afterthought.

> **Project status:** Groundwork phase. Core architecture and tooling are in place; production-ready chart components (starting with `BarChart`) are still in development. See the [Roadmap](./docs/src/content/docs/getting-started/roadmap.mdx) for details.

## Preface & Repository Mirror Notice

Please be aware of our repository structure:

* **Official Repository:** [git.byting-pandas.ninja/Ninosaurier/LUNA-Charts](https://git.byting-pandas.ninja/Ninosaurier/LUNA-Charts)

**Important:** All development, including issue tracking and contribution management, takes place exclusively on our self-hosted server. Issues and pull requests cannot be created or processed on this GitHub mirror. Please visit the original link above to report bugs or request features.

## Why LUNA Charts

Most charting libraries treat accessibility as an add-on. LUNA Charts builds it in from the start:

* **Accessible by default** — components are designed and tested against WCAG guidance from day one, not patched in afterward
* **Framework-agnostic** — built as standard Web Components (Stencil), usable in React, Vue, Angular, Svelte, or plain HTML
* **SVG-based rendering** — inspectable, stylable, and screen-reader-friendly output instead of an opaque canvas

## Tech Stack

| Area | Technology |
| --- | --- |
| Component framework | [Stencil](https://stenciljs.com) (compiles to standard Web Components) |
| Language | TypeScript |
| Package manager | pnpm (monorepo workspaces) |
| Unit & component testing | [Vitest](https://vitest.dev), with [Playwright](https://playwright.dev) as the browser provider |
| Accessibility testing | axe-core |
| Documentation | [Starlight](https://starlight.astro.build) |
| Component explorer | Storybook |
| Linting & formatting | ESLint, Prettier |
| Release management | [Changesets](https://github.com/changesets/changesets) |

The full set of architecture decisions behind these choices is documented in [`docs/.../architecture/adr`](./docs/src/content/docs/architecture/adr) and the broader [Architecture Development Method (ADM) documentation](./docs/src/content/docs/architecture/adm).

## Project Structure

```text
luna-charts/
│
├── packages/
│   └── luna-charts/        # The library itself (Stencil components, Storybook)
│
├── docs/                    # Architecture docs, ADRs, guides (Starlight)
│
├── examples/                # Usage examples (framework integrations)
│
├── .changeset/               # Release/versioning configuration
│
└── .github/                  # Community health files (Code of Conduct, etc.)
```

## Getting Started

### Prerequisites

* Node.js `>= 22.0.0`
* pnpm `11.11.0` (see `devEngines` in `package.json`; pnpm will be downloaded automatically via Corepack if missing)
* Docker (required for running component/browser tests locally, see below)

### Installation

```bash
git clone https://github.com/Ninosaurier/LUNA-Charts.git
cd luna-charts
pnpm install
```

or

```bash
git clone https://git.byting-pandas.ninja/Ninosaurier/LUNA-Charts.git
cd luna-charts
pnpm install
```

### Common commands

| Command | Description |
| --- | --- |
| `pnpm test:unit` | Run unit tests for the `luna-charts` package |
| `pnpm test:component` | Run component/browser tests inside the containerized Playwright environment |
| `pnpm test` | Run the full test suite (unit + component) |
| `pnpm changeset` | Record a changeset for your change (required for any user-facing change) |
| `pnpm run docs` | Start the documentation site locally (astroJS) |

### Storybook

Storybook currently needs to be started from within the library package directly:

```bash
cd packages/luna-charts
pnpm run storybook
```

> **Note:** Running Storybook from the repository root isn't set up yet. This is a known gap — contributions to add a root-level `pnpm --filter` script are welcome.

Component and browser tests run inside Docker (`docker-compose.test.yaml`) to guarantee a reproducible browser environment across all contributors and CI — you don't need Playwright browsers installed locally.

## Documentation

* **Architecture documentation**: see `docs/` — includes the full Architecture Development Method (ADM) documentation (vision, business architecture, technology architecture, governance, migration planning) and all Architecture Decision Records (ADRs)
* **Contributing**: see [CONTRIBUTING.md](./CONTRIBUTING.md)
* **Code of Conduct**: see [.github/CODE_OF_CONDUCT.md](./.github/CODE_OF_CONDUCT.md)

## License

LUNA Charts is licensed under the [GNU Lesser General Public License v3.0 (LGPL-3.0)](./LICENSE).
# Agentic Systems Fieldnotes

An English, anonymized, interactive engineering case study for an enterprise agentic platform. An editorial portfolio combining interactive architecture demonstrations with a runnable Rust execution kernel.

## Live website

[Explore Agentic Systems Fieldnotes](https://haokun12x.github.io/agentic-systems-fieldnotes/)

## Deployment

Every push to `main` runs the **Deploy static site to GitHub Pages** workflow. It publishes the contents of `dist/` to the URL above; the workflow can also be started manually from the Actions tab.

In **Settings → Pages → Build and deployment**, the source must be **GitHub Actions**. The initial activation requires repository settings access; SSH Git authentication authorizes source pushes but does not change these settings.

No Node.js, dependency installation, compilation, server, database, or API key is required to publish this static site. All assets use relative URLs and work beneath the repository subpath. The workflow uploads only `dist/`; the runnable Rust example and development files remain in the repository. See [GitHub's custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Preview locally

```sh
python -m http.server 8765 --directory dist
```

Open `http://localhost:8765`. HTTP preview enables consistent clipboard/download behavior; double-clicking `dist/index.html` also supports the self-contained page.

## Project structure

```text
dist/
  index.html
  styles.css
  app.js
  runtime.js
  runtime.css
  .nojekyll
  assets/
    favicon.svg
    technical-notes.md
    acceptance-checklist.md
    runtime-design-notes.md
    runtime-kernel.rs
    runtime-kernel-readme.md
    runtime-kernel.zip
examples/runtime-kernel/
  main.rs
  README.md
  pixi.toml
  pixi.lock
.github/workflows/pages.yml
README.md
```

## Interactive experiences

- Five inspectable runtime layers: definitions, state/checkpoints, invocation context, task scheduling, and process resources.
- A checkpoint stepper with immutable fan-out snapshots, barrier updates, simulated worker loss, version-checked resume, budgets, and cancellation.
- Four practical computation experiments: typed composition, Result/Kleisli-style failure propagation, reducer laws, and bounded cycles.
- Six architecture boundaries with contracts and invariants.
- Personal, project, and department isolation, including simulated permission-epoch revocation.
- A durable action state machine, response-loss injection, and reconciliation without duplicate effects.
- Three business walkthroughs: departmental decisions, news intelligence, and railway maintenance.
- A cache mean-latency calculator with explicit assumptions and visible modeled results.
- Four model migration profiles, plus expandable engineering decisions.

## Runnable Rust reference kernel

`examples/runtime-kernel/main.rs` contains a dependency-free, real Rust execution kernel. It registers captured callable values through `Arc<dyn Fn>`, dispatches node IDs, reads immutable superstep snapshots, merges deltas at barriers, validates version/scope-bound checkpoint resumptions, bounds cyclic execution, and separates effect intents from an illustrative operation ledger. Thirteen meaningful Rust tests passed in the included isolated pixi environment.

The reference executes its frontier synchronously and stores checkpoints/ledger entries in memory. Async workers and atomic durable storage in the website’s Rust design sketches are separate production extensions. The browser does not execute the Rust binary; it visualizes the contracts. Download `dist/assets/runtime-kernel.zip` for the source, tests, README, and pixi lockfile.

## Editorial and privacy boundaries

Company and repository names, internal endpoints, source paths, customer identifiers, and credentials are absent from public assets. Document examples and operation IDs are synthetic. The case study distinguishes an existing project foundation from target enterprise architecture and planned acceptance criteria. Quantitative improvements are labeled **modeled**, not claimed production measurements.

No analytics, cookies, trackers, external fonts, CDN dependencies, or network calls are required by the website. External technical references are ordinary links opened only at the visitor's request. All simulations run in browser memory and reset on reload.

## Customize

Change the wordmark, title and description in `dist/index.html` if attaching the site to your personal identity. Adjust the palette and typography using the CSS variables at the top of `dist/styles.css`. Modify scenario and architecture data near the beginning of `dist/app.js`.

Only replace modeled results with actual measurements when the target hardware, workload, quality gates, and benchmark method are documented. Preserve that distinction when adapting the page for a CV or portfolio.

## Accessibility and compatibility

Semantic headings, keyboard-operable controls, visible focus outlines, live status updates, a skip link, mobile navigation, and reduced-motion preferences are supported. Static content remains readable without JavaScript. Tested against Chromium at desktop and mobile sizes; additional browser testing may be appropriate before a public launch.

Validation on 2026-10-11: the original 46 browser interaction checks passed, and the runtime extension adds independently checked function/state/algebra controls plus 13 compiled Rust tests; no runtime or console errors and no horizontal overflow at 1440 px and 390 px. Automated axe WCAG AA checks reported zero violations in the default view and representative permission-revocation, selected-architecture, and confirmed-execution states. Repository-subpath loading was also verified. Automated checks cover the tested states and are not a substitute for a complete manual accessibility audit.

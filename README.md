# Systems Fieldnotes

An English, anonymized, interactive engineering atlas for an enterprise agentic platform. Follow a request through the system, explore eight core mechanisms, and inspect the contracts that turn runtime events into a user interface. The original runtime laboratory and executable Rust reference remain available below the new atlas.

## Deploy to GitHub Pages

1. Create a GitHub repository and upload this project's files, including `.github/workflows/pages.yml` and `dist/`. The deployment ZIP includes both.
2. Set the default branch to `main`, or change the workflow branch to your chosen default branch.
3. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
4. Push a commit to `main`, or run the **Deploy static site to GitHub Pages** workflow manually.
5. GitHub supplies the published `https://<account>.github.io/<repository>/` URL. A repository named `<account>.github.io` uses the root URL instead.

No Node.js, dependency installation, compilation, server, database, or API key is required. Every asset uses a relative URL, so the same site works at a domain root or a repository subpath. The workflow uploads only `dist/`, keeping development and hosting metadata outside the public site. Follow [GitHub's custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) for repository access or environment protection requirements.

For branch-based publishing, copy the **contents** of `dist/` into the repository root and select that root as the Pages source; `.nojekyll` is included.

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
  atlas.css
  journey.js / journey.css
  mechanisms.js / mechanisms.css
  protocol.js / protocol.css
  .nojekyll
  assets/
    favicon.svg
    technical-notes.md
    acceptance-checklist.md
    runtime-design-notes.md
    runtime-kernel.rs
    runtime-kernel-readme.md
    runtime-kernel.zip
src/sections/
  journey.html / mechanisms.html / protocol.html
scripts/
  assemble-atlas.py
examples/runtime-kernel/
  main.rs
  README.md
  pixi.toml
  pixi.lock
.github/workflows/pages.yml
README.md
```

## Interactive atlas

The first three sections form a progressive explanation, with synthetic data and browser-only state:

- **Request lifecycle:** a nine-stage procurement review, clickable dependency diagram, play/pause/step controls, permission-denied and read-timeout branches, user/runtime envelopes, event trail, evidence and artifact projection, and JSON trace export.
- **Mechanism atlas:** eight separate diagrams for scoped hybrid retrieval, versioned multi-user collaboration, governed departmental joins, authorization and recovery, concurrent task scheduling, KV prefill/decode, cache-aware load balancing, and hardware operator lowering. Each mode exposes input controls, state changes, engineering details, an invariant, and primary-source references.
- **Wire protocol:** a four-lane sequence with seven inspectable packets. Compare internal traces with sanitized public events and the corresponding UI. Simulate disconnection, replay, duplicate delivery and an expired replay window; inspect database, voice, document, and service integration boundaries.

No backend, database or device is connected to these demonstrations. Simulated routing costs and memory calculations are illustrative; they are not production benchmark results. Internal traces are shown for teaching and are explicitly separated from data that an application should expose to its users.

### Editing the atlas

CSS and JavaScript are served directly from `dist/`. Edit section markup in `src/sections/`, then refresh the generated blocks in `dist/index.html`:

```sh
python scripts/assemble-atlas.py
```

The assembler also checks for duplicate HTML IDs. Commit both the source fragments and the refreshed homepage. Publishing and local preview remain buildless and need no JavaScript dependencies.

## Engineering reference experiences

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

Source-company identities, internal repository names and endpoints, private source paths, customer identifiers, and credentials are absent from public assets. The homepage links to this public demonstration repository. Document examples and operation IDs are synthetic. The case study distinguishes an existing project foundation from target enterprise architecture and planned acceptance criteria. Quantitative improvements are labeled **modeled**, not claimed production measurements.

No analytics, cookies, trackers, external fonts, CDN dependencies, or network calls are required by the website. External technical references are ordinary links opened only at the visitor's request. All simulations run in browser memory and reset on reload.

## Customize

Change the wordmark, title and description in `dist/index.html` if attaching the site to your personal identity. Adjust the atlas palette and typography in `dist/atlas.css`; the original reference styles remain in `dist/styles.css` and `dist/runtime.css`. Modify scenario and architecture data near the beginning of `dist/app.js`.

Only replace modeled results with actual measurements when the target hardware, workload, quality gates, and benchmark method are documented. Preserve that distinction when adapting the page for a CV or portfolio.

## Accessibility and compatibility

Semantic headings, keyboard-operable controls, visible focus outlines, live status updates, a skip link, mobile navigation, and reduced-motion preferences are supported. Static content remains readable without JavaScript. Tested against Chromium at desktop and mobile sizes; additional browser testing may be appropriate before a public launch.

Validation on 2026-10-11: 100 integrated atlas checks passed at 1440, 768, and 390 px, covering all eight mechanisms, all request scenarios, valid SSE framing, denial without evidence leakage, trace export, keyboard tabs, packet sanitization, replay, duplicate suppression, and snapshot resync. No browser errors, document overflow, or axe WCAG A/AA violations were found in the tested views. The original architecture, isolation, recovery, performance, navigation, and clipboard interactions were also checked. The existing Rust reference retains its previously verified 13 tests; its source was not changed in this update.

Complex diagrams remain readable through labeled, keyboard-focusable horizontal scrolling on small screens. Automated accessibility checks cover tested states and do not replace a complete manual accessibility audit.

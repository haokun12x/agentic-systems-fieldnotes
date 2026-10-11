# Systems Fieldnotes

An English interactive field guide grounded in an inspected enterprise Agent application. It presents LangGraph and custom Rust as backend implementation routes for the same Agent contracts, and explains how context, tools, observations, and state drive an adaptive loop; clearly marked extensions cover production scheduling and hardware portability. All examples are anonymized and synthetic.

## Preview and edit

```sh
python -m http.server 8766 --directory dist
python scripts/assemble-atlas.py
```

Open `http://localhost:8766`. Edit module markup in `src/sections/`, run the assembler, and commit both fragments and `dist/index.html`. CSS and JavaScript are served directly from `dist/`; no Node build, backend, database, API key, or CDN dependency is required. Asset URLs work at a domain root or GitHub repository subpath.

## Main experiences

- **Adaptive Agent loop:** five query trajectories; optional todos and delegation; weak results and structured errors return to the model for another decision. Department resources and four model configuration choices are explained separately.
- **Backend routes:** switch between LangGraph and Rust, map shared Agent requirements to each, and inspect bounded fan-out, worker-loss recovery, and uncertain external effects. The executable Rust kernel is the foundation for the full custom service.
- **Workspaces:** state, thread disk, and read-only knowledge routes; lifecycle events; the concrete state-to-disk PDF export bridge; explicit reflection versus private model reasoning.
- **Compatibility:** independently select software deployment and model execution targets. Observed container/API contracts are distinguished from Kubernetes, musl, and accelerator targets.
- **Six cases:** indexed news, report/PDF, Word uploads, dictation/meeting audio, dataset reads versus unsupported writes, and API discovery/query/token refresh. Inspect each actor, layer, argument, observation, and subsequent choice.
- **Access and routing:** vary origin, department credentials, browser identity, and thread ownership; inspect fixed department routing; explore queue pressure, cache locality, and KV eligibility in a labeled scheduling extension.
- **Frontend protocol:** inspect actual SDK submission, SSE messages and values, tool-result association, UI state updates, reconnect and cancellation boundaries.

The optional **Engineering reference labs** preserve the broader eight-mechanism atlas and runnable Rust example. The Rust kernel supplies a concrete foundation for the alternative backend route; the broader reference mechanisms illustrate its production extension path.

See [implementation notes](dist/assets/implementation-notes.md) for the audited contracts, missing integration boundaries, and public framework references. The original [technical notes](dist/assets/technical-notes.md), [runtime design](dist/assets/runtime-design-notes.md), and [Rust example](examples/runtime-kernel/README.md) remain reference material.

## Files

- `src/sections/{journey,backends,workspaces,cases,control,protocol}.html`: primary implementation sections.
- `dist/{journey,backends,workspaces,cases,control,protocol}.{js,css}`: independent browser interactions and styling.
- `dist/index.html`, `atlas.css`, `fieldguide.js`: page composition, shared design, and expandable reference navigation.
- `src/sections/mechanisms.html`, `dist/mechanisms.*`, `app.js`, `runtime.*`: optional engineering reference.
- `scripts/assemble-atlas.py`: deterministic assembly with duplicate-ID checks.
- `.github/workflows/pages.yml`: GitHub Pages deployment from `dist/` on `main`.

## Publication

The repository publishes to GitHub Pages using GitHub Actions. Only `dist/` is uploaded; development and hosting metadata are excluded. The same static assets also support the existing Sites deployment without changing its audience.

## Editorial boundaries and validation

The page documents source contracts, not live production telemetry. Counts describe checked configuration. Model-selected paths can vary. Illustrative scheduling costs are not benchmarks. Private repository names, endpoints, company identities, credentials, and real customer data are excluded from public assets.

Interactions remain in browser memory and reset on reload. The website requires no cookies, analytics, external fonts, or network API calls. Framework references are ordinary outbound links.

Validation covers integrated interactions, failure branches, keyboard navigation, responsive layouts, local anchor/download targets, browser errors, and automated WCAG A/AA checks. Detailed test outputs are retained outside the public site. The unchanged Rust reference retains its previous 13 passing tests.

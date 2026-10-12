# Systems Fieldnotes

An English interactive field guide grounded in an inspected enterprise Agent application. It presents LangGraph and custom Rust as backend implementation routes for the same Agent contracts, and explains how context, tools, observations, and state drive an adaptive loop; clearly marked extensions cover production scheduling and hardware portability. All examples are anonymized and synthetic.

## Preview and edit

```sh
python -m http.server 8766 --directory dist
python scripts/assemble-atlas.py
```

Open `http://localhost:8766`. Edit module markup in `src/sections/`, run the assembler, and commit both fragments and `dist/index.html`. The assembler sets the reading order, inserts part dividers' fragments, and adds a "next chapter" link after each numbered chapter. CSS and JavaScript are served directly from `dist/`; no Node build, backend, database, API key, or CDN dependency is required. Asset URLs work at a domain root or GitHub repository subpath.

## Reading order

The page is organized so a newcomer can start from the big picture and drill down:

- **00 · The system at a glance:** a 71-second explainer video (with transcript) and an interactive system map that follows one request through six stops, each linking to the chapter that explains it.
- **Part I · How it behaves:** 01 The Agent loop · 02 Six real use cases.
- **Part II · How it’s built:** 03 Files & storage · 04 Access & routing · 05 What crosses the wire.
- **Part III · Design choices:** 06 Backend routes · 07 Agent strategies · 08 Deployment compatibility · 09 Where it fits.
- **Optional reference labs:** the broader mechanism atlas, failure lab, theory, and the Rust kernel.

Every chapter opens with an “In plain terms” summary. A reading-progress bar, part-aware header navigation, and a floating contents menu keep the reader oriented.

## Explainer video

`dist/assets/explainer.mp4` and its poster are rendered from `scripts/video/explainer.html`, a CSS-animated 1280×720 scene file whose animation delays are absolute video times. To change the video, edit that file (open it in a browser to preview in real time), then:

```sh
pip install playwright imageio-ffmpeg && playwright install chromium
python scripts/render-video.py --stills 3 30 60   # optional: preview frames
python scripts/render-video.py                    # renders 2,130 frames → MP4 + poster
```

Rendering seeks every CSS animation to each frame time, so output is deterministic.

## Main experiences

- **Positioning:** source-linked comparisons with Dify, LangChain, LangGraph, Codex, Claude Code, Pi, and the harness role; integration choices and enterprise operating-contract ownership.
- **Agent strategies:** definitions and constructive mappings for ReAct, Plan-and-Execute, Reflexion, Tree of Thoughts, LATS, RAG, delegation, and human review. Switch backend routes and compose a review boundary; current primitives and controller extensions are labeled.

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

- `src/sections/overview.html`, `dist/overview.{js,css}`: the at-a-glance section, video embed, and interactive system map.
- `src/sections/{journey,cases,workspaces,control,protocol,backends,patterns,compatibility,landscape}.html`: the nine numbered chapters; `part-{1,2,3}.html`: part dividers.
- `dist/{landscape,journey,backends,workspaces,cases,control,protocol}.{js,css}`: independent browser interactions and styling (`landscape.*` also drives the strategies chapter; `workspaces.*` also drives compatibility).
- `dist/guide.{js,css}`: reading structure — part dividers, plain-language summaries, next-chapter links, progress bar, active part navigation, floating contents menu.
- `dist/index.html`, `atlas.css`, `fieldguide.js`: page composition, shared design, and expandable reference navigation.
- `scripts/video/explainer.html`, `scripts/render-video.py`: explainer video source and renderer.
- `src/sections/mechanisms.html`, `dist/mechanisms.*`, `app.js`, `runtime.*`: optional engineering reference.
- `scripts/assemble-atlas.py`: deterministic assembly (reading order, next-chapter links, asset tags) with duplicate-ID checks.
- `.github/workflows/pages.yml`: GitHub Pages deployment from `dist/` on `main`.

## Publication

The repository publishes to GitHub Pages using GitHub Actions. Only `dist/` is uploaded; development and hosting metadata are excluded. The same static assets also support the existing Sites deployment without changing its audience.

## Editorial boundaries and validation

The page documents source contracts, not live production telemetry. Counts describe checked configuration. Model-selected paths can vary. Illustrative scheduling costs are not benchmarks. Private repository names, endpoints, company identities, credentials, and real customer data are excluded from public assets.

Interactions remain in browser memory and reset on reload. The website requires no cookies, analytics, external fonts, or network API calls. Framework references are ordinary outbound links.

Validation covers integrated interactions, failure branches, keyboard navigation, responsive layouts, local anchor/download targets, browser errors, and automated WCAG A/AA checks. Detailed test outputs are retained outside the public site. The unchanged Rust reference retains its previous 13 passing tests.

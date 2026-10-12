/* Systems Fieldnotes · static interactions, no runtime dependencies. */
(() => {
  "use strict";

  const architecture = {
    governance: {
      kicker: "01 / GOVERNANCE PLANE",
      title: "Authority exists outside the model.",
      description: "A single policy plane translates identity, workspace membership, data sensitivity and action risk into enforceable capabilities. Every data read and external write is checked at the service boundary.",
      invariant: "A generated plan never grants permission. Approval binds the exact action, parameters, destination and expiry.",
      technologies: ["Federated identity", "RBAC + ABAC + ReBAC", "Capability tokens", "Authorization epochs"],
      contract: "authorize(principal, workspace, resource, action, policy_version) → scoped capability"
    },
    workspace: {
      kicker: "02 / WORKSPACE & MEMORY",
      title: "Shared context. Explicit boundaries.",
      description: "Private, project and department spaces have separate membership rules, content versions and retrieval scopes. A conversation inherits a workspace boundary; publishing creates a reviewed copy with its own access policy.",
      invariant: "Conversation state, search results, artifacts and caches use the same authorization boundary.",
      technologies: ["Versioned artifacts", "Row-level security", "Membership epochs", "Optimistic concurrency"],
      contract: "read(workspace_id, conversation_id, version, entitlement_fingerprint) → authorized snapshot"
    },
    orchestration: {
      kicker: "03 / DURABLE ORCHESTRATION",
      title: "Progress survives a process restart.",
      description: "A durable task records its intent, checkpoints, approved operations and recovery history. Agent reasoning runs within the task; external side effects pass through an operation ledger and a reconciliation path.",
      invariant: "An uncertain response enters Unknown. Recovery queries the external result before attempting another action.",
      technologies: ["Durable workflows", "Outbox", "Idempotency keys", "Operation ledger"],
      contract: "prepare → authorize → send → confirm | unknown → reconcile"
    },
    data: {
      kicker: "04 / ENTERPRISE DATA PLANE",
      title: "Cross-domain answers without shared superuser access.",
      description: "Department-owned data products expose approved fields, business definitions and freshness contracts. Parallel reads join evidence through governed business keys, while source permissions remain authoritative.",
      invariant: "Every answer can name its source, observation time, data version and access decision.",
      technologies: ["Data product APIs", "Semantic query plans", "CDC projections", "Hybrid retrieval"],
      contract: "query(domain, allowed_fields, filters, freshness_budget) → evidence + provenance"
    },
    execution: {
      kicker: "05 / ISOLATED EXECUTION",
      title: "A useful action has a contained blast radius.",
      description: "Workers execute typed tool contracts in bounded environments. Leases, fencing tokens, deadline budgets and fair queues control concurrent work. High-impact changes require an approval bound to the final payload.",
      invariant: "Tool output is untrusted input. Runtime authority is short-lived, scoped and auditable.",
      technologies: ["Sandboxed workers", "Typed tool contracts", "Fencing tokens", "Backpressure"],
      contract: "execute(operation_id, capability, input_snapshot, deadline) → result + audit event"
    },
    inference: {
      kicker: "06 / MODEL & HARDWARE PLANE",
      title: "Model intelligence behind a portable service contract.",
      description: "Route each task to an evaluated model profile, then schedule inference within latency, capacity and privacy limits. Accelerator-specific runtimes sit behind a stable API and versioned quality gates.",
      invariant: "A portable userspace does not make accelerator drivers or native operators compatible.",
      technologies: ["Quality-based routing", "Scoped prefix reuse", "Continuous batching", "Hardware adapters"],
      contract: "infer(model_profile, authorized_context, latency_budget) → output + version + usage"
    }
  };

  const scenarios = {
    procurement: {
      title: "A procurement decision across three departments.",
      summary: "Finance, legal and administration contribute evidence to a single review packet. Data owners keep their access rules, and a human approves the final business action.",
      steps: [
        ["Establish the review boundary", "Resolve the requester, project membership and permitted finance, legal and administrative data products."],
        ["Read independent evidence in parallel", "Fetch the budget position, contract exceptions and supplier records under separate scoped capabilities."],
        ["Join by governed business keys", "Align the supplier and contract identifiers; expose missing evidence and mismatched update times."],
        ["Build a versioned decision packet", "Produce a recommendation with source citations, observed timestamps and the precise proposed payload."],
        ["Approve and commit", "Bind approval to the final payload hash. Record the operation before calling the external business service."],
        ["Publish the outcome", "Reconcile the external result and publish the approved packet to the project workspace with its own policy."]
      ],
      boundary: "Budget and contract records stay in their source domains. Only the approved evidence packet is published to the project."
    },
    news: {
      title: "A daily intelligence brief with accountable citations.",
      summary: "A scheduled workflow turns many overlapping public reports into a concise, cited brief. Editorial review controls what reaches a shared department space.",
      steps: [
        ["Schedule within a bounded budget", "Set a deadline, source allowlist, publication window and maximum model-token budget."],
        ["Fetch and normalize source records", "Capture publication time, canonical URL and content hash; isolate retrieved text from system instructions."],
        ["Deduplicate before generation", "Group exact and near-duplicate reports, retain distinct viewpoints and mark unverified claims."],
        ["Generate an evidence-linked draft", "Summarize the retained records with citations and separate reporting from editorial interpretation."],
        ["Review, publish and retain lineage", "A reviewer approves the artifact. Publish a versioned brief and retain the source-to-claim mapping."]
      ],
      boundary: "Public source text remains untrusted. A source never receives tool authority, and a draft never becomes a shared publication implicitly."
    },
    railway: {
      title: "A railway maintenance review grounded in live evidence.",
      summary: "Operational observations and deterministic engineering calculations inform a maintenance review. The system exposes uncertainty and gives qualified operators control over operational decisions.",
      steps: [
        ["Resolve the asset and time window", "Select the authorized route, equipment identifiers, inspection window and telemetry freshness requirement."],
        ["Collect typed operational evidence", "Read track geometry, condition indicators, power maintenance and inspection records through bounded APIs."],
        ["Validate and calculate", "Check units and missing readings, then run versioned deterministic engineering calculations outside the model."],
        ["Explain the evidence and uncertainty", "Create a traceable review with source timestamps, thresholds, calculation inputs and unresolved observations."],
        ["Request an operator decision", "Present the proposed maintenance work item and its exact scope for qualified human review."],
        ["Record and reconcile the handoff", "Create the approved work item through the execution ledger; reconcile its external identifier and retain the audit trail."]
      ],
      boundary: "The agent supports analysis and work-order preparation. Safety-critical control remains in the authorized operational system."
    }
  };

  const scopes = {
    private: {
      title: "Private workspace",
      description: "The owner controls the conversation, uploaded evidence and derived artifacts. Sharing is an explicit publish operation that creates a new artifact under the destination policy.",
      permissions: ["Owner-only conversation and artifact access", "Retrieval filtered by owner and workspace", "No implicit sharing with project or department members"],
      key: "HMAC(tenant | owner | private_workspace | conversation | authz_epoch)",
      epoch: 41
    },
    project: {
      title: "Project workspace",
      description: "Named members collaborate on versioned artifacts. Membership does not confer access to every member's source data or private conversations; publication carries a separate review.",
      permissions: ["Explicit project membership and role checks", "Shared artifacts with version history and conflict control", "Source permissions rechecked for every retrieval"],
      key: "HMAC(tenant | project | entitlement_fingerprint | artifact_version | authz_epoch)",
      epoch: 78
    },
    department: {
      title: "Department workspace",
      description: "Department-owned knowledge follows steward-managed permissions, retention rules and publication workflows. Cross-department access uses approved data products rather than a global database role.",
      permissions: ["Department roles plus resource sensitivity checks", "Reviewed publication and retention policies", "Cross-domain evidence exposed through scoped contracts"],
      key: "HMAC(tenant | department | entitlement_fingerprint | data_version | authz_epoch)",
      epoch: 126
    }
  };

  const migrations = {
    llm: {
      title: "Language & vision-language models",
      description: "Move the model weights, tokenizer, templates and preprocessing together. Validate every operator and accelerator runtime, then qualify precision and task behavior on a fixed enterprise evaluation set.",
      checks: ["Reference profile: FP16 or BF16; qualify INT8 / INT4 separately", "Preserve tokenization, prompt templates and image preprocessing", "Compare task success, visual grounding and tool-call validity", "Measure time to first token, output throughput and peak memory"]
    },
    asr: {
      title: "Speech recognition pipeline",
      description: "Port the complete audio path: decoding, resampling, voice activity detection, feature extraction and recognition. Evaluate real recordings under the target runtime rather than relying on successful model loading.",
      checks: ["Reference profile: FP16; accept reduced precision only after WER / CER evaluation", "Match sample rate, channel count, normalization and segmentation", "Test accents, noisy recordings, long audio and domain terminology", "Measure real-time factor, tail latency and segment-boundary behavior"]
    },
    ocr: {
      title: "Document recognition pipeline",
      description: "Preserve detection, orientation, recognition and layout analysis as a versioned pipeline. Validate page-level evidence, tables and reading order before making extracted text available to retrieval.",
      checks: ["Reference profile: FP16; qualify INT8 on representative document batches", "Validate resize rules, normalization, vocabulary and output decoding", "Compare character error, table structure and reading-order accuracy", "Measure pages per second, memory and repeated-page reuse"]
    },
    embedding: {
      title: "Embedding & reranking services",
      description: "A new embedding model creates a new vector space. Build a separate index, evaluate retrieval under the same authorization rules, then switch traffic by version with a reversible rollout.",
      checks: ["Reference profile: FP16; qualify INT8 using retrieval and ranking metrics", "Pin tokenizer, pooling, normalization and vector dimensions", "Compare Recall@k, nDCG and access-filter correctness", "Use dual indexes for canary traffic, rollback and retirement"]
    }
  };

  const stateLabels = {
    prepared: "Prepared",
    authorized: "Authorized",
    sent: "Sent",
    unknown: "Unknown",
    reconciled: "Reconciled",
    confirmed: "Confirmed"
  };
  const principle = "The model proposes. Policy authorizes. Durable execution commits. Evidence explains.";
  const runtime = {
    initialized: false,
    scope: "private",
    scopeState: Object.fromEntries(Object.entries(scopes).map(([name, scope]) => [name, { epoch: scope.epoch, revoked: false }])),
    simulation: { running: false, generation: 0, effectCount: 0, visited: [], state: "idle" },
    waits: new Set()
  };

  const byId = (id) => document.getElementById(id);
  const setText = (id, value) => {
    const element = byId(id);
    if (element) element.textContent = value;
  };
  const reducedMotion = () => typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function selectButtons(selector, selectedValue, attribute) {
    document.querySelectorAll(selector).forEach((button) => {
      const selected = button.getAttribute(attribute) === selectedValue;
      button.classList.toggle("is-active", selected);
      if (button.getAttribute("role") === "tab") button.setAttribute("aria-selected", String(selected));
      else button.setAttribute("aria-pressed", String(selected));
    });
  }

  function fillList(id, values, className) {
    const element = byId(id);
    if (!element) return;
    const fragment = document.createDocumentFragment();
    values.forEach((value) => {
      const item = document.createElement("li");
      if (className) item.className = className;
      item.textContent = value;
      fragment.appendChild(item);
    });
    element.replaceChildren(fragment);
  }

  function selectLayer(name) {
    const layer = architecture[name];
    if (!layer) return;
    selectButtons("[data-layer]", name, "data-layer");
    setText("layer-kicker", layer.kicker);
    setText("layer-title", layer.title);
    setText("layer-description", layer.description);
    setText("layer-invariant", layer.invariant);
    setText("layer-contract", layer.contract);
    const technologyList = byId("layer-tech");
    if (technologyList) {
      technologyList.replaceChildren(...layer.technologies.map((label) => {
        const item = document.createElement("span");
        item.className = "tech-chip";
        item.textContent = label;
        return item;
      }));
    }
  }

  function selectScenario(name) {
    const scenario = scenarios[name];
    if (!scenario) return;
    selectButtons("[data-scenario]", name, "data-scenario");
    setText("scenario-title", scenario.title);
    setText("scenario-summary", scenario.summary);
    setText("scenario-boundary", scenario.boundary);
    const list = byId("scenario-steps");
    if (!list) return;
    const steps = scenario.steps.map(([title, description], index) => {
      const item = document.createElement("li");
      item.className = "scenario-step";
      const number = document.createElement("span");
      number.className = "step-index";
      number.textContent = String(index + 1).padStart(2, "0");
      number.setAttribute("aria-hidden", "true");
      const content = document.createElement("div");
      content.className = "step-content";
      const heading = document.createElement("h4");
      heading.textContent = title;
      const body = document.createElement("p");
      body.textContent = description;
      content.append(heading, body);
      item.append(number, content);
      return item;
    });
    list.replaceChildren(...steps);
    list.dataset.stepCount = String(steps.length);
  }

  function selectScope(name) {
    if (!scopes[name]) return;
    runtime.scope = name;
    const scope = scopes[name];
    const state = runtime.scopeState[name];
    selectButtons("[data-scope]", name, "data-scope");
    setText("scope-title", scope.title);
    setText("scope-description", scope.description);
    fillList("scope-permissions", scope.permissions);
    setText("scope-key", state.revoked
      ? `CACHE ACCESS DENIED · authz_epoch=${state.epoch} · previous capability and cached response rejected`
      : `${scope.key.replace("authz_epoch", `authz_epoch=${state.epoch}`)}`);
    setText("scope-access", state.revoked ? "Denied · current principal revoked" : "Granted · current membership verified");
    const access = byId("scope-access");
    if (access) {
      access.classList.toggle("is-denied", state.revoked);
      access.setAttribute("data-access", state.revoked ? "denied" : "granted");
      access.closest(".scope-control")?.classList.toggle("is-denied", state.revoked);
    }
    const revokeButton = byId("revoke-access");
    if (revokeButton) {
      revokeButton.textContent = state.revoked ? "Restore access" : "Revoke access";
      revokeButton.setAttribute("aria-pressed", String(state.revoked));
    }
  }

  function toggleAccess() {
    const state = runtime.scopeState[runtime.scope];
    state.revoked = !state.revoked;
    state.epoch += 1;
    selectScope(runtime.scope);
  }

  function calculateCache(hitPercent) {
    const percentage = Math.max(0, Math.min(95, Number(hitPercent) || 0));
    const hitRate = percentage / 100;
    const baseline = 220;
    const latency = 20 + hitRate * 2 + (1 - hitRate) * 200;
    return { percentage, hitRate, baseline, latency, gain: ((baseline - latency) / baseline) * 100 };
  }

  function updateCache() {
    const input = byId("cache-hit");
    if (!input) return;
    const calculation = calculateCache(input.value);
    setText("cache-value", `${calculation.percentage}%`);
    setText("cache-latency", calculation.latency.toFixed(1));
    setText("cache-gain", calculation.gain.toFixed(1));
    input.setAttribute("aria-valuetext", `${calculation.percentage} percent authorized cache hit rate, ${calculation.latency.toFixed(1)} milliseconds calculated mean latency`);
    const bar = byId("cache-bar-optimized");
    if (bar) {
      bar.setAttribute("width", String(360 * calculation.latency / calculation.baseline));
      bar.parentElement?.setAttribute("aria-label", `Calculated mean latency ${calculation.latency.toFixed(1)} milliseconds`);
    }
  }

  function selectMigration(name) {
    const migration = migrations[name];
    if (!migration) return;
    const select = byId("migration-model");
    if (select) select.value = name;
    setText("migration-title", migration.title);
    setText("migration-description", migration.description);
    fillList("migration-checks", migration.checks);
  }

  function updateSimulationState(state) {
    runtime.simulation.state = state;
    if (state !== "idle" && !runtime.simulation.visited.includes(state)) runtime.simulation.visited.push(state);
    setText("sim-state", stateLabels[state] || "Idle");
    setText("sim-action-count", String(runtime.simulation.effectCount));
    document.querySelectorAll("[data-state]").forEach((node) => {
      const nodeState = node.getAttribute("data-state");
      const current = nodeState === state;
      const visited = runtime.simulation.visited.includes(nodeState);
      node.classList.toggle("is-active", current);
      node.classList.toggle("is-current", current);
      node.classList.toggle("is-complete", visited && !current);
      if (current) node.setAttribute("aria-current", "step");
      else node.removeAttribute("aria-current");
    });
  }

  function addSimulationEvent(timestamp, message, state) {
    const log = byId("simulation-log");
    if (!log) return;
    const item = document.createElement("li");
    item.className = `simulation-event${state ? ` event-${state}` : ""}`;
    const time = document.createElement("span");
    time.className = "log-time";
    time.textContent = timestamp;
    const detail = document.createElement("span");
    detail.className = "sim-log-message";
    detail.textContent = message;
    item.append(time, detail);
    log.appendChild(item);
  }

  function cancelSimulationWaits() {
    for (const wait of runtime.waits) {
      window.clearTimeout(wait.timeout);
      wait.resolve(false);
    }
    runtime.waits.clear();
  }

  function waitForSimulation(milliseconds, generation) {
    return new Promise((resolve) => {
      const wait = { timeout: null, resolve };
      wait.timeout = window.setTimeout(() => {
        runtime.waits.delete(wait);
        resolve(runtime.simulation.generation === generation);
      }, milliseconds);
      runtime.waits.add(wait);
    });
  }

  function simulationControls(running, completed = false) {
    const run = byId("run-simulation");
    const injection = byId("inject-failure");
    if (run) {
      run.disabled = running;
      run.textContent = running ? "Running simulation…" : completed ? "Run again" : "Run simulation";
    }
    if (injection) injection.disabled = running;
  }

  function resetSimulation() {
    runtime.simulation.generation += 1;
    cancelSimulationWaits();
    runtime.simulation.running = false;
    runtime.simulation.effectCount = 0;
    runtime.simulation.visited = [];
    const log = byId("simulation-log");
    if (log) log.replaceChildren();
    addSimulationEvent("READY", "Run the simulation to inspect the operation ledger and its recovery path.", "idle");
    setText("simulation-status", "Ready · illustrative execution trace");
    updateSimulationState("idle");
    simulationControls(false);
  }

  async function startSimulation(options = {}) {
    if (runtime.simulation.running) return false;
    resetSimulation();
    const log = byId("simulation-log");
    if (log) log.replaceChildren();
    runtime.simulation.running = true;
    const generation = runtime.simulation.generation;
    const checkbox = byId("inject-failure");
    const failure = typeof options.failure === "boolean" ? options.failure : Boolean(checkbox && checkbox.checked);
    const speed = Number.isFinite(options.speed) && options.speed > 0 ? options.speed : 1;
    const delay = (reducedMotion() ? 380 : 820) / speed;
    simulationControls(true);
    setText("simulation-status", "Running · example timestamps, simulated external service");

    const events = [
      { time: "T+000 ms", state: "prepared", message: "Persist operation op_demo_001 with payload hash and idempotency key." },
      { time: "T+040 ms", state: "authorized", message: "Verify capability and exact-payload approval; record the authorization decision." },
      { time: "T+085 ms", state: "sent", effect: true, message: "External service commits the operation once. Local confirmation is still pending." }
    ];
    if (failure) {
      events.push(
        { time: "T+2085 ms", state: "unknown", message: "Response times out after the external commit. Mark Unknown; do not issue a blind retry." },
        { time: "T+2300 ms", state: "reconciled", message: "Query the external operation key. Recover the committed result and its receipt." },
        { time: "T+2340 ms", state: "confirmed", message: "Persist the receipt and complete the workflow. External effects: exactly one in this demonstration." }
      );
    } else {
      events.push({ time: "T+125 ms", state: "confirmed", message: "Persist the external receipt and complete the workflow. External effects: exactly one in this demonstration." });
    }

    for (let index = 0; index < events.length; index += 1) {
      if (index > 0 && !(await waitForSimulation(delay, generation))) return false;
      if (runtime.simulation.generation !== generation) return false;
      const event = events[index];
      if (event.effect) runtime.simulation.effectCount += 1;
      updateSimulationState(event.state);
      addSimulationEvent(event.time, event.message, event.state);
      if (event.state === "unknown") setText("simulation-status", "Recovering · reconcile before any new external action");
    }
    runtime.simulation.running = false;
    setText("simulation-status", failure ? "Confirmed · ambiguous response reconciled · one external effect" : "Confirmed · receipt recorded · one external effect");
    simulationControls(false, true);
    return true;
  }

  function initializeAccordions() {
    document.querySelectorAll("[data-decision]").forEach((button) => {
      const body = button.nextElementSibling;
      if (!body || !body.classList.contains("decision-body")) return;
      if (!body.id) body.id = `decision-${button.getAttribute("data-decision") || Math.random().toString(36).slice(2)}`;
      button.setAttribute("aria-controls", body.id);
      const initiallyOpen = button.getAttribute("aria-expanded") === "true";
      body.hidden = !initiallyOpen;
      const icon = button.querySelector(".accordion-icon");
      if (icon) icon.textContent = initiallyOpen ? "−" : "+";
      button.addEventListener("click", () => {
        const open = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(open));
        body.hidden = !open;
        if (icon) icon.textContent = open ? "−" : "+";
        button.closest(".decision")?.classList.toggle("is-open", open);
      });
    });
  }

  function initializeNavigation() {
    const toggle = byId("menu-toggle");
    const mobileNavigation = byId("mobile-nav");
    function setMenu(open) {
      if (!toggle || !mobileNavigation) return;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      mobileNavigation.hidden = !open;
      mobileNavigation.classList.toggle("is-open", open);
    }
    if (toggle && mobileNavigation) {
      setMenu(false);
      toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
      mobileNavigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
          setMenu(false);
          toggle.focus();
        }
      });
      document.addEventListener("click", (event) => {
        if (toggle.getAttribute("aria-expanded") === "true" && !toggle.contains(event.target) && !mobileNavigation.contains(event.target)) setMenu(false);
      });
    }

    // Active-section highlighting lives in guide.js.
  }

  function initializeReveals() {
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || reducedMotion()) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    document.documentElement.classList.add("reveal-enabled");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px 30px 0px" });
    elements.forEach((element) => observer.observe(element));
  }

  async function copyPrinciple() {
    const feedback = byId("copy-feedback");
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(principle);
      if (feedback) feedback.textContent = "Principle copied.";
    } catch (_) {
      const input = document.createElement("textarea");
      input.value = principle;
      input.setAttribute("aria-label", "System design principle");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      let copied = false;
      try { copied = document.execCommand("copy"); } catch (_) { /* Provide useful feedback below. */ }
      input.remove();
      byId("copy-principle")?.focus();
      if (feedback) feedback.textContent = copied ? "Principle copied." : `Copy this principle: ${principle}`;
    }
  }

  function initialize() {
    if (runtime.initialized) return;
    runtime.initialized = true;
    document.documentElement.classList.add("js-enabled");
    document.querySelectorAll("[data-layer]").forEach((button) => button.addEventListener("click", () => selectLayer(button.getAttribute("data-layer"))));
    document.querySelectorAll("[data-scenario]").forEach((button) => button.addEventListener("click", () => selectScenario(button.getAttribute("data-scenario"))));
    document.querySelectorAll("[data-scope]").forEach((button) => button.addEventListener("click", () => selectScope(button.getAttribute("data-scope"))));
    byId("revoke-access")?.addEventListener("click", toggleAccess);
    byId("cache-hit")?.addEventListener("input", updateCache);
    byId("migration-model")?.addEventListener("change", (event) => selectMigration(event.target.value));
    byId("run-simulation")?.addEventListener("click", () => { void startSimulation(); });
    byId("reset-simulation")?.addEventListener("click", resetSimulation);
    byId("copy-principle")?.addEventListener("click", () => { void copyPrinciple(); });
    selectLayer(document.querySelector('[data-layer][aria-pressed="true"], [data-layer][aria-selected="true"]')?.getAttribute("data-layer") || "governance");
    selectScenario(document.querySelector('[data-scenario][aria-pressed="true"], [data-scenario][aria-selected="true"]')?.getAttribute("data-scenario") || "procurement");
    selectScope(document.querySelector('[data-scope][aria-pressed="true"], [data-scope][aria-selected="true"]')?.getAttribute("data-scope") || "private");
    selectMigration(byId("migration-model")?.value || "llm");
    updateCache();
    resetSimulation();
    initializeAccordions();
    initializeNavigation();
    initializeReveals();
  }

  window.SystemsFieldnotes = Object.freeze({
    architecture, scenarios, scopes, migrations, principle,
    calculateCache, selectLayer, selectScenario, selectScope, toggleAccess,
    selectMigration, startSimulation, resetSimulation, initialize,
    getSimulation: () => ({ ...runtime.simulation, visited: [...runtime.simulation.visited] }),
    getScope: () => ({ name: runtime.scope, ...runtime.scopeState[runtime.scope] })
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();

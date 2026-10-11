/* Runtime laboratory: a deterministic browser model of proposed Rust contracts. */
(() => {
  "use strict";

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const union = (...sets) => [...new Set(sets.flat())].sort();
  const byId = (id) => document.getElementById(id);
  const put = (id, value) => { const element = byId(id); if (element) element.textContent = value; };

  const layers = Object.freeze({
    definition: {
      title: "Definition runtime · describe the computation",
      description: "Compose typed nodes, routes and reducer rules into a versioned graph. A callable is executable code inside one process; a durable FunctionRef is a stable name plus a version and serializable arguments. A worker resolves that reference through an allowlisted registry.",
      contract: "FunctionRef + Args → validated TaskSpec · compile(GraphSpec) → ExecutionPlan",
      lifetime: "Graph version · deployed code; closures and captured sockets are never serialized."
    },
    state: {
      title: "State runtime · make change explicit",
      description: "Nodes read an immutable snapshot and return a small delta. A channel reducer merges the deltas at a barrier, then the checkpoint stores state and the next frontier. This gives recovery a precise place to continue.",
      contract: "(StateSnapshot, Input) → Delta · reduce(State, Deltas) → State′",
      lifetime: "Conversation or workflow · versioned, serializable, recoverable."
    },
    context: {
      title: "Invocation runtime · carry authority, not history",
      description: "Workspace identity, capabilities, deadline and cancellation belong to the invocation envelope. They are visible to a node without becoming model-visible conversation history. On recovery, policy is checked again; live authority is never inherited from an old checkpoint blindly.",
      contract: "RunContext { principal, workspace, capabilities, deadline, cancellation }",
      lifetime: "One invocation · fresh authorization and bounded lifetime."
    },
    task: {
      title: "Task runtime · schedule progress",
      description: "The scheduler owns ready tasks, concurrent fan-out, barriers, retry classification and a bounded step count. Parallel nodes share a prior snapshot; they do not read each other’s unfinished writes. One durable coordinator owns retries so nested frameworks cannot multiply attempts.",
      contract: "Ready frontier → bounded workers → pending writes → barrier → next frontier",
      lifetime: "One workflow execution · durable task identity, attempt and checkpoint lineage."
    },
    resource: {
      title: "Resource runtime · keep machines out of state",
      description: "Database pools, model clients, queues and accelerator sessions are process resources. The worker injects borrowed handles into a node and cleans them up when its scope ends. An external action is an intent sent to an execution gateway with a separate ledger.",
      contract: "Registry.resolve(FunctionRef) · Resources → node · EffectIntent → gateway",
      lifetime: "Worker process or request scope · reconnect on restart; never checkpoint a handle."
    }
  });

  const algebra = Object.freeze({
    compose: {
      formula: "f : A → B     g : B → C     g ∘ f : A → C",
      plain: "A function produces a value the next function understands. Passing the function and passing its result are different operations: local code can pass a callable; a durable queue passes a versioned reference and arguments.",
      technical: "Typed composition makes incompatible stages visible before execution. Function composition is associative when the types line up. An agent graph also has effects, branches and loops, so it is not merely a chain of pure functions.",
      example: "normalize : Request → Query\nretrieve  : Query → Evidence\ncompose(retrieve, normalize) : Request → Evidence"
    },
    effects: {
      formula: "f : A → Result<B, E>     g : B → Result<C, E>\ng ⋆ f = λa. f(a).and_then(g)",
      plain: "A failed step carries an explicit failure. The next step runs only when the previous result succeeds. A database write or model call adds more structure: authority, cancellation and retry policy must be part of the execution contract.",
      technical: "Kleisli composition describes functions whose outputs are wrapped in an effect such as Result. Its laws help reason about composition; they do not make a network write atomic or exactly-once. A typed intent and an operation ledger handle those concerns separately.",
      example: "parse(request)\n  .and_then(validate)\n  .and_then(prepare_intent)\n// A validation error does not call the gateway."
    },
    reduce: {
      formula: "E₁ ⊕ E₂ = sorted_union(E₁, E₂)     identity = ∅",
      plain: "Finance and legal return independent evidence sets. Union produces the same final set regardless of completion order. Sorting adds a canonical representation, making checkpoints and replay comparisons stable.",
      technical: "Set union is associative, commutative and idempotent: a join-semilattice with an empty identity. These properties suit duplicate evidence IDs. List append is order-sensitive, and a last-writer-wins reducer needs an explicit ordering rule. The reducer must match the business meaning.",
      example: "finance = {budget:v7, supplier:v2}\nlegal   = {contract:v4, supplier:v2}\nmerge   = {budget:v7, contract:v4, supplier:v2}"
    },
    cycles: {
      formula: "Stateₙ₊₁ = F(Stateₙ)     stop = accepted ∨ budget = 0 ∨ cancelled",
      plain: "An agent may inspect a result and revise its plan. That creates a loop. A runtime can guarantee a bounded number of attempts, but it cannot guarantee the model will discover a satisfactory answer.",
      technical: "General termination cannot be decided for every program. A finite budget bounds transitions that return; deadlines and cancellation require cooperative checks. Non-yielding or untrusted work needs process isolation and enforceable limits. These controls do not prove semantic convergence or correctness.",
      example: "while !accepted && remaining > 0 {\n  state = inspect_and_revise(state);\n  remaining -= 1;\n}\nreturn accepted ? Complete : NeedsReview;"
    }
  });

  const snippets = {
    plain: [
      "Resolve a versioned graph.\nKeep durable state separate from the invocation context.\nPut normalize on the ready frontier.",
      "query = normalize(state.request)\nreturn Delta { query }\nnext = [finance, legal]",
      "snapshot = state.clone()\nfinance_result = finance(snapshot, scoped_context)\nlegal_result   = legal(snapshot, scoped_context)\n// Both read the same state version; writes remain pending.",
      "state.evidence = sorted_union(\n  state.evidence, finance_delta, legal_delta\n)\ncheckpoint(state, next = [draft])\n// The barrier commits once. A restart resumes at draft.",
      "packet = draft(state.evidence)\nreturn Delta { packet }\n// Evidence references survive the transformation.",
      "intent = prepare(state.packet, operation_id)\n// A prepared intent is not an external side effect.\n// The gateway rechecks live authority before dispatch.",
      "receipt = simulated_gateway(intent)\nledger.record(receipt)\n// This browser simulation performs no external write."
    ],
    rust: [
      "struct RunContext<'a> {\n    principal: &'a Principal,\n    capabilities: &'a CapabilitySet,\n    resources: &'a Resources,\n    cancel: CancellationToken,\n}\n// Illustrative contract: lifetimes keep handles out of State.",
      "fn normalize(state: &State) -> Result<Delta, Error> {\n    let query = Query::validate(&state.request)?;\n    Ok(Delta::Query(query))\n}\n// A node returns an explicit value; it does not mutate shared state.",
      "let snapshot = Arc::new(state.clone());\nlet (finance, legal) = tokio::join!(\n    registry.call(FINANCE_V1, snapshot.clone(), &ctx),\n    registry.call(LEGAL_V1, snapshot.clone(), &ctx),\n);\npending.extend([finance?, legal?]);",
      "let evidence: BTreeSet<EvidenceId> = pending\n    .iter().flat_map(Delta::evidence_ids).collect();\nstate.evidence.extend(evidence);\ncheckpointer.commit(&state, &[DRAFT_V1]).await?;\n// Transactional checkpoint; no socket or closure is persisted.",
      "let packet = draft(&state.evidence, &ctx).await?;\nlet delta = Delta::Packet(packet);\nstate = apply_delta(state, delta)?;\n// The model call is effectful; its accepted output is recorded.",
      "let intent = EffectIntent {\n    operation_id: state.operation_id.clone(),\n    payload_hash: hash(&state.packet),\n    action: Action::PublishReviewPacket,\n};\n// Send an intent, not a captured function pointer.",
      "let receipt = gateway.submit(&intent, &fresh_capability).await?;\nledger.confirm(&intent.operation_id, &receipt).await?;\n// Ambiguous outcomes require reconciliation, not blind retry."
    ]
  };

  const explanations = [
    "Code defines behavior; the state stores values; the invocation supplies authority; worker resources stay process-local. The excerpts are Rust-style design contracts, not a deployed Rust backend.",
    "The normalization function borrows a snapshot and returns a delta. Its signature defines what it can read and what it can produce.",
    "Finance and legal both read version 1. Their completion order can vary; neither sees the other’s pending write. The simulator computes both results synchronously to show the scheduling semantics.",
    "The channel barrier merges evidence IDs by set union, commits version 2 and records draft as the next frontier. Failure injection occurs after this committed checkpoint.",
    "The draft node runs after evidence has committed. A real model call is nondeterministic: record its accepted output and version; do not confuse replaying recorded results with recomputing them.",
    "The task emits a typed intent with a stable operation identifier. The runtime has not performed the business action merely by creating this value.",
    "The local simulator creates a synthetic acknowledgement. A real execution gateway owns fresh authorization, idempotency, receipts and ambiguous-outcome reconciliation; the graph alone provides no exactly-once guarantee."
  ];

  const nodeNames = ["normalize", "finance", "legal", "merge", "draft", "commit"];
  const frontiers = [["normalize"], ["finance", "legal"], ["merge"], ["draft"], ["commit:prepare"], ["commit:acknowledge"], []];

  function createKernel(options = {}) {
    const budget = Math.max(2, Math.min(8, Number(options.budget) || 6));
    return {
      phase: 0, spent: 0, budget, status: "ready", injected: false,
      inject: Boolean(options.inject), stateVersion: 0, pendingWrites: [], checkpoint: null,
      state: {
        request: "Prepare a cross-domain procurement review",
        query: null, evidence: [], packet: null, intent: null, receipt: null
      },
      context: {
        principal: "reviewer:demo", workspace: "project:demo", trace: "trace:local-001",
        capability_scopes: ["finance:read", "legal:read", "review:prepare"],
        deadline: "bounded by invocation policy", cancellation: false,
        resources: "injected handles · never serialized in checkpoint"
      },
      log: [{ phase: 0, kind: "ready", text: "Graph v1 resolved; normalize is ready. No external call has been made." }]
    };
  }

  function checkpointOf(kernel) {
    return {
      checkpoint_id: "local-checkpoint:barrier-2", graph_version: "procurement:v1",
      state_schema: "review-state:v1", reducer_version: "evidence-union:v1",
      state_version: kernel.stateVersion, committed_transition: 3, committed_superstep: 2,
      step_budget: { consumed: 3, limit: kernel.budget },
      state: clone(kernel.state), pending_tasks: ["draft:v1"],
      completed_tasks: ["normalize:v1", "finance:v1", "legal:v1"],
      invocation_descriptor: { principal: kernel.context.principal, workspace: kernel.context.workspace },
      recovery_requires: ["version compatibility", "fresh policy check", "resource reconstruction"]
    };
  }

  function advanceKernel(kernel) {
    if (kernel.status !== "ready") return false;
    if (kernel.spent >= kernel.budget) { kernel.status = "exhausted"; return false; }
    const phase = kernel.phase + 1;
    let text = "";
    switch (phase) {
      case 1:
        kernel.state.query = { supplier: "supplier:demo", fields: ["budget", "contract"], input_version: "request:v1" };
        kernel.stateVersion += 1;
        text = "normalize returned a Query delta. State v1 committed; finance and legal share this snapshot.";
        break;
      case 2:
        kernel.pendingWrites = [
          { node: "finance", read_version: kernel.stateVersion, evidence: ["budget:v7", "supplier:v2"] },
          { node: "legal", read_version: kernel.stateVersion, evidence: ["contract:v4", "supplier:v2"] }
        ];
        text = "Two read nodes completed against state v1. Four evidence IDs are pending; committed state is unchanged.";
        break;
      case 3:
        kernel.state.evidence = union(kernel.state.evidence, ...kernel.pendingWrites.map((delta) => delta.evidence));
        kernel.pendingWrites = [];
        kernel.stateVersion += 1;
        kernel.checkpoint = checkpointOf(kernel);
        if (kernel.inject && !kernel.injected) {
          kernel.injected = true; kernel.status = "paused";
          text = "Barrier committed state v2 and pending draft in this local model. Worker loss is simulated after commit; resume from this frontier.";
        } else text = "Barrier committed state v2. Set union deduplicated supplier:v2; the checkpoint points to draft.";
        break;
      case 4:
        kernel.state.packet = { artifact: "review-packet:v1", evidence: [...kernel.state.evidence], outcome: "Human review required" };
        kernel.stateVersion += 1;
        text = "draft accepted an evidence-linked packet. State v3 records the output; this browser makes no model call.";
        break;
      case 5:
        kernel.state.intent = {
          operation_id: "op:review-local-001", action: "publish_review_packet",
          payload_version: "review-packet:v1", status: "prepared", requires_fresh_authorization: true
        };
        kernel.stateVersion += 1;
        text = "A typed publication intent is prepared. The execution gateway must authorize the final payload; no external write occurred.";
        break;
      case 6:
        kernel.state.receipt = { operation_id: "op:review-local-001", receipt: "synthetic:local-ack", external_calls: 0 };
        kernel.stateVersion += 1;
        kernel.status = "complete";
        text = "A synthetic gateway acknowledgement completed the demonstration. Real effects require an operation ledger and reconciliation.";
        break;
      default: return false;
    }
    kernel.phase = phase;
    kernel.spent += 1;
    if (kernel.status === "ready" && kernel.spent >= kernel.budget && kernel.phase < 6) kernel.status = "exhausted";
    kernel.log.push({ phase, kind: kernel.status, text });
    return true;
  }

  function resumeKernel(kernel) {
    if (kernel.status !== "paused" || !kernel.checkpoint) return false;
    const checkpoint = kernel.checkpoint;
    if (checkpoint.graph_version !== "procurement:v1" || checkpoint.state_schema !== "review-state:v1" || checkpoint.reducer_version !== "evidence-union:v1") {
      kernel.status = "incompatible";
      kernel.log.push({ phase: kernel.phase, kind: "incompatible", text: "Checkpoint version mismatch. Recovery needs a tested migration or the original compatible worker." });
      return false;
    }
    // A fresh local policy fixture models reauthorization; no backend is queried.
    const freshContext = createKernel().context;
    const descriptor = checkpoint.invocation_descriptor;
    if (!descriptor || descriptor.principal !== freshContext.principal || descriptor.workspace !== freshContext.workspace) {
      kernel.status = "denied";
      kernel.log.push({ phase: kernel.phase, kind: "denied", text: "The fresh demo policy fixture rejected this checkpoint's principal or workspace. No continuation runs." });
      return false;
    }
    kernel.state = clone(checkpoint.state);
    kernel.stateVersion = checkpoint.state_version;
    kernel.phase = checkpoint.committed_transition;
    kernel.spent = Math.max(kernel.spent, checkpoint.step_budget.consumed);
    kernel.pendingWrites = [];
    kernel.context = { ...freshContext, trace: "trace:local-001:resumed" };
    kernel.status = kernel.spent >= kernel.budget ? "exhausted" : "ready";
    kernel.log.push({ phase: kernel.phase, kind: "resumed", text: "Compatible checkpoint restored; a fresh demo context matched principal and workspace. Policy and resource reconstruction are simulated. Draft is next; committed read nodes are not rerun." });
    return true;
  }

  const result = {
    ok: (value) => ({ ok: true, value }),
    error: (error) => ({ ok: false, error }),
    bind: (value, fn) => value.ok ? fn(value.value) : value
  };

  function testAlgebra(name, complexity = 3) {
    const size = Math.max(1, Math.min(8, Number(complexity) || 3));
    if (name === "compose") {
      const normalize = (request) => ({ query: request.trim().toLowerCase() });
      const retrieve = (query) => ({ evidence: [`source:${query.query}`] });
      const count = (evidence) => evidence.evidence.length;
      const compose = (g, f) => (value) => g(f(value));
      const inputs = Array.from({ length: size }, (_, i) => `  REVIEW ${i + 1}  `);
      const left = inputs.map(compose(count, compose(retrieve, normalize)));
      const right = inputs.map(compose(compose(count, retrieve), normalize));
      const passed = left.every((value, i) => value === right[i]);
      return { passed, text: `Both grouping orders returned the same evidence count for ${size} independent input${size === 1 ? "" : "s"}. Associativity holds for these pure, compatible functions; distributed effects still need explicit contracts.`, details: { inputs, left, right } };
    }
    if (name === "effects") {
      let prepareCalls = 0;
      const validate = (value) => value.approved ? result.ok(value) : result.error("Approval missing");
      const prepare = (value) => { prepareCalls += 1; return result.ok({ intent: value.id }); };
      const rejected = Array.from({ length: size }, (_, i) => result.bind(validate({ id: `review:${i + 1}`, approved: false }), prepare));
      const accepted = Array.from({ length: size }, (_, i) => result.bind(validate({ id: `review:${i + 1}`, approved: true }), prepare));
      const passed = rejected.every((value) => !value.ok) && accepted.every((value) => value.ok) && prepareCalls === size;
      return { passed, text: `${size} rejected input${size === 1 ? "" : "s"} short-circuited; prepare ran ${prepareCalls} time${prepareCalls === 1 ? "" : "s"} for ${size} accepted input${size === 1 ? "" : "s"}. These are local function calls, not network requests or an atomic transaction.`, details: { rejected, accepted, prepare_calls: prepareCalls } };
    }
    if (name === "reduce") {
      const a = Array.from({ length: size }, (_, i) => `finance:${i + 1}`);
      const b = ["shared:1", ...Array.from({ length: size }, (_, i) => `legal:${i + 1}`)];
      const c = ["shared:1", "audit:1"];
      const canonical = (value) => JSON.stringify(value);
      const forward = union(a, b);
      const reverse = union(b, a);
      const associative = canonical(union(union(a, b), c)) === canonical(union(a, union(b, c)));
      const commutative = canonical(forward) === canonical(reverse);
      const idempotent = canonical(union(a, a)) === canonical(union(a));
      const identity = canonical(union(a, [])) === canonical(union(a));
      return { passed: associative && commutative && idempotent && identity, text: `Verified associativity, commutativity, idempotence and the empty identity on ${size} generated items per domain. Both completion orders yield ${forward.length} canonical IDs. This sample validates the demonstration; the set-union law follows from its definition.`, details: { associative, commutative, idempotent, identity, forward, reverse } };
    }
    if (name === "cycles") {
      let remaining = size;
      let iterations = 0;
      while (remaining > 0) { iterations += 1; remaining -= 1; }
      return { passed: iterations === size && remaining === 0, text: `A deliberately non-converging plan stopped after ${iterations} transition${iterations === 1 ? "" : "s"} with NeedsReview. The budget bounded execution; it did not prove the answer correct or the underlying program terminating.`, details: { iterations, remaining, outcome: "NeedsReview" } };
    }
    return { passed: false, text: "Choose a composition rule first." };
  }

  let kernel = createKernel();
  let selectedLayer = "definition";
  let selectedAlgebra = "compose";
  let codeView = "plain";
  let initialized = false;

  function selectLayer(name) {
    if (!layers[name]) return;
    selectedLayer = name;
    const entry = layers[name];
    put("runtime-layer-title", entry.title);
    put("runtime-layer-description", entry.description);
    put("runtime-layer-contract", entry.contract);
    put("runtime-layer-lifetime", entry.lifetime);
    document.querySelectorAll("[data-runtime-layer]").forEach((button) => {
      const active = button.dataset.runtimeLayer === name;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("is-active", active);
    });
  }

  function selectAlgebra(name) {
    if (!algebra[name]) return;
    selectedAlgebra = name;
    const entry = algebra[name];
    put("algebra-formula", entry.formula);
    put("algebra-plain", entry.plain);
    put("algebra-technical", entry.technical);
    put("algebra-example", entry.example);
    put("algebra-test-result", "Change the sample size, then run the concrete check.");
    document.querySelectorAll("[data-algebra]").forEach((button) => {
      const active = button.dataset.algebra === name;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("is-active", active);
    });
  }

  function renderKernel() {
    const states = {
      ready: "Ready · advance the next bounded transition",
      paused: "Worker lost · committed checkpoint is available",
      exhausted: "Budget exhausted · raise the limit or reset",
      complete: "Complete · synthetic receipt, zero external calls",
      cancelled: "Cancelled · no new transition will start",
      incompatible: "Recovery blocked · checkpoint version mismatch",
      denied: "Recovery denied · demo scope check failed"
    };
    put("kernel-superstep", `${kernel.phase} / 6`);
    put("kernel-status", states[kernel.status]);
    put("kernel-frontier", frontiers[kernel.phase].join(" + ") || "No pending tasks");
    put("kernel-state", JSON.stringify({ state_version: kernel.stateVersion, ...kernel.state, pending_writes: kernel.pendingWrites }, null, 2));
    put("kernel-context", JSON.stringify({ ...kernel.context, step_budget: { used: kernel.spent, limit: kernel.budget } }, null, 2));
    put("kernel-checkpoint", kernel.checkpoint ? JSON.stringify(kernel.checkpoint, null, 2) : "No committed barrier checkpoint yet.\nAdvance normalize, the parallel reads and their merge.");
    put("kernel-code", snippets[codeView][kernel.phase]);
    put("kernel-explanation", `${explanations[kernel.phase]}${codeView === "rust" ? " Rust-style contract shown; the async adapter and transactional storage are production integrations, separate from the synchronous local Rust reference." : ""}`);
    put("kernel-budget-value", String(kernel.budget));

    const step = byId("kernel-step");
    const resume = byId("kernel-resume");
    const cancel = byId("kernel-cancel");
    if (step) step.disabled = kernel.status !== "ready";
    if (resume) resume.disabled = kernel.status !== "paused";
    if (cancel) cancel.disabled = ["complete", "cancelled", "incompatible", "denied"].includes(kernel.status);
    const injection = byId("kernel-inject");
    if (injection) injection.disabled = kernel.phase >= 3;

    const complete = new Set();
    if (kernel.phase >= 1) complete.add("normalize");
    if (kernel.phase >= 2) { complete.add("finance"); complete.add("legal"); }
    if (kernel.phase >= 3) complete.add("merge");
    if (kernel.phase >= 4) complete.add("draft");
    if (kernel.phase >= 6) complete.add("commit");
    const current = new Set(frontiers[kernel.phase].map((node) => node.split(":")[0]));
    document.querySelectorAll("[data-kernel-node]").forEach((element) => {
      const name = element.dataset.kernelNode;
      const status = complete.has(name) ? "complete" : current.has(name) ? "current" : "waiting";
      element.dataset.nodeStatus = status;
      element.classList.toggle("is-complete", status === "complete");
      element.classList.toggle("is-current", status === "current");
      element.setAttribute("aria-label", `${name}: ${status}`);
    });
    const log = byId("kernel-log");
    if (log) {
      log.replaceChildren();
      kernel.log.forEach((entry) => {
        const item = document.createElement("li");
        const number = document.createElement("span");
        number.className = "kernel-log-step";
        number.textContent = String(entry.phase).padStart(2, "0");
        const body = document.createElement("span");
        body.textContent = entry.text;
        item.dataset.eventKind = entry.kind;
        item.append(number, body);
        log.append(item);
      });
    }
  }

  function emit() {
    document.dispatchEvent(new CustomEvent("runtime:state", { detail: { phase: kernel.phase, status: kernel.status, stateVersion: kernel.stateVersion } }));
  }

  function step() { const changed = advanceKernel(kernel); renderKernel(); if (changed) emit(); return changed; }
  function resume() { const changed = resumeKernel(kernel); renderKernel(); if (changed) emit(); return changed; }
  function reset() {
    kernel = createKernel({ budget: byId("kernel-budget")?.value || 6, inject: byId("kernel-inject")?.checked });
    renderKernel(); emit(); return clone(kernel);
  }
  function cancel() {
    if (["complete", "cancelled", "incompatible", "denied"].includes(kernel.status)) return false;
    kernel.status = "cancelled";
    kernel.context.cancellation = true;
    kernel.log.push({ phase: kernel.phase, kind: "cancelled", text: "Cancellation requested. No new task starts; real workers must cooperate at cancellation points and reconcile any in-flight effects." });
    renderKernel(); emit(); return true;
  }

  function initialize() {
    if (initialized) return;
    initialized = true;
    document.querySelectorAll("[data-runtime-layer]").forEach((button) => button.addEventListener("click", () => selectLayer(button.dataset.runtimeLayer)));
    document.querySelectorAll("[data-algebra]").forEach((button) => button.addEventListener("click", () => selectAlgebra(button.dataset.algebra)));
    byId("kernel-step")?.addEventListener("click", step);
    byId("kernel-reset")?.addEventListener("click", reset);
    byId("kernel-resume")?.addEventListener("click", resume);
    byId("kernel-cancel")?.addEventListener("click", cancel);
    byId("kernel-view")?.addEventListener("change", (event) => {
      codeView = event.target.value === "rust" ? "rust" : "plain";
      renderKernel();
    });
    byId("kernel-inject")?.addEventListener("change", (event) => { kernel.inject = Boolean(event.target.checked); });
    byId("kernel-budget")?.addEventListener("input", (event) => {
      kernel.budget = Math.max(2, Math.min(8, Number(event.target.value) || 6));
      if (kernel.status === "ready" && kernel.spent >= kernel.budget) kernel.status = "exhausted";
      if (kernel.status === "exhausted" && kernel.spent < kernel.budget) kernel.status = "ready";
      renderKernel();
    });
    byId("algebra-input")?.addEventListener("input", (event) => {
      put("algebra-input-value", event.target.value);
      put("algebra-test-result", "Sample changed. Run the concrete check again.");
    });
    byId("algebra-test")?.addEventListener("click", () => {
      const test = testAlgebra(selectedAlgebra, byId("algebra-input")?.value || 3);
      put("algebra-test-result", `${test.passed ? "Check passed" : "Check failed"} · ${test.text}`);
      const target = byId("algebra-test-result");
      if (target) target.dataset.checkStatus = test.passed ? "passed" : "failed";
    });
    selectLayer("definition");
    selectAlgebra("compose");
    put("algebra-input-value", byId("algebra-input")?.value || "3");
    reset();
  }

  window.RuntimeLab = Object.freeze({
    layers, algebra, snippets, createKernel, advanceKernel, resumeKernel, testAlgebra, union,
    selectLayer, selectAlgebra, step, resume, reset, cancel, initialize,
    getKernel: () => clone(kernel),
    getSelected: () => ({ layer: selectedLayer, algebra: selectedAlgebra, codeView }),
    getNodeNames: () => [...nodeNames]
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();

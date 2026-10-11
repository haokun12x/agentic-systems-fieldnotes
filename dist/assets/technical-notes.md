# Enterprise Agentic Systems — Engineering Field Notes

**A system earns autonomy by making its boundaries, decisions, and recovery behavior inspectable.**

This anonymized case study describes the engineering foundation and enterprise architecture of a platform spanning office knowledge work and rail infrastructure operations. Several departments own different facts, several people share a case, and proposed actions have consequences beyond the conversation.

The design separates interpretation from authority. Models understand requests, retrieve evidence, and propose structured steps. Identity services, data gateways, durable state, execution contracts, and source systems determine what can happen and what counts as complete.

## Evidence and scope

The implementation review established a working application foundation: Python graph-based agent orchestration; a React and TypeScript conversation interface; department-specific knowledge and tool configurations; server-side browser ownership checks; isolated conversation directories; metadata-first retrieval; document export; PDF, OCR, and speech-processing integrations; and domain APIs for infrastructure inspection and maintenance. A dedicated engineering workbench also keeps deterministic calculations separate from generated explanations.

These are implementation facts, not proof of enterprise production readiness. Browser ownership is not an employee identity system. Local directories are not governed collaboration spaces. Model-processing endpoints do not establish which neural models are installed. Example deployment instructions do not establish operational high availability. Durable orchestration, organization identity, policy epochs, transactional execution ledgers, cell isolation, and disaster recovery are architecture targets requiring integration and acceptance evidence.

Every performance figure below is an explicit model of a possible benefit, not a measured production result.

## 01 — Authority travels with the work

A trusted request context identifies the tenant, employee, workload, department, workspace, purpose, classification, policy version, and authorization epoch. The gateway creates this context; the model cannot modify it. Short-lived workload credentials and explicit delegation replace shared source-system secrets in prompts.

Authorization combines roles, resource attributes, and relationships. A finance role may permit a category of operation, while a project relationship controls the specific contract and classification controls disclosure. Delegated authority is the intersection of the employee, delegation, agent, workload, resource policy, and environment. Calling a more privileged agent must not silently expand that intersection.

An `authz_epoch` changes when project membership or another relevant grant changes. Revocation propagates to retrieval, summaries, caches, and pending work. Ordinary read propagation has a proposed P99 target of 60 seconds. Sensitive exports and real business submissions check authoritative authorization at commit time. 
## 02 — Cross-department data becomes a product

Departments retain authoritative ownership of contracts, procurement, payment, acceptance, and maintenance records. A data product adds a named owner, versioned schema, business definitions, freshness, permitted fields, query limits, and failure semantics. A cross-department answer composes these products rather than copying every department database into a shared model context.

Live transactional facts use controlled APIs or bounded read-only queries. Historical analysis can use change-data capture into governed analytical datasets. Entity resolution and deterministic checks reconcile identifiers, currencies, units, and asset locations before facts are combined.

A query compiler constrains generated plans with parameterized requests, syntax allowlists, deadlines, scan budgets, and row limits. Database row-level security can provide defense in depth where supported, but only with a non-owner runtime account and trusted session context. It cannot rescue an application that lets the model set its own identity variables.

Each answer carries source versions and observation times. A collection of current-looking facts from different databases is not a global transaction snapshot. Before a write, the source system checks the current object version and business preconditions again.

## 03 — Collaboration preserves private thinking

Four scopes remain distinct: personal workspaces, project workspaces, department knowledge, and conversation/run scratch space. Project membership grants access to approved project objects, not everybody’s personal conversations.

Content is immutable and versioned. A mutable metadata pointer selects the current version through a conditional commit using `expected_revision`. Two concurrent edits produce an explicit conflict rather than a silent overwrite. Collaborative text can use a CRDT when simultaneous editing warrants it; approvals, permissions, budgets, and engineering calculations remain transactional.

Publishing a private analysis creates a separate project-visible artifact. The service checks source permissions, classification, redaction, and destination membership, then records provenance and the approved version. A model that has read confidential information cannot lower the classification of its output through a prompt.

The same rule applies to less visible surfaces: search snippets, transcripts, exported documents, derived text, embeddings, summaries, and resumed checkpoints inherit source restrictions. Isolation is a property of the complete information path.

## 04 — Execution is a state machine

A conversation is an interaction surface. A business case is an objective. A task is durable work. A run is an attempt. An operation is a stable business intent that survives retries and failover.

A graph runtime owns bounded reasoning steps. A durable workflow service owns long waits, timers, task recovery, deadlines, and human approval when those requirements justify it. One service owns final task state; two runtimes must not independently retry the same business action.

### Execution walkthrough: a maintenance proposal

1. **Receive.** Persist the request and create a task with a stable case identifier. Resolve the employee’s workspace and permitted infrastructure assets.
2. **Observe.** Read versioned inspection records, maintenance history, and relevant operational facts. Record source times and gaps.
3. **Analyze.** Run deterministic engineering calculations in the dedicated service. The agent explains results and prepares a structured maintenance proposal.
4. **Review.** Present evidence, scope, cost, object versions, and the intended write. Approval binds to that exact proposal and digest.
5. **Authorize.** Recheck current membership, delegation, policy, and source preconditions. A changed proposal or invalidated approval returns to review.
6. **Submit.** Write an operation ledger entry and send the request with a stable idempotency key where the source API supports one. Worker ownership uses leases and fencing; source-side protection still matters.
7. **Reconcile.** A timeout moves the operation to `Unknown`. Query the source system or reconcile its business reference before sending again. If the result cannot be established safely, route to manual review.
8. **Complete.** Mark success only after authoritative confirmation. Publish the permitted artifact, receipt, and audit trail; preserve unresolved work visibly.

**A timeout is uncertainty, not permission to repeat the action.**

An outbox closes the local state-and-message dual-write gap. It still needs deduplicating consumers and does not place a remote transaction inside the local database transaction. A compensating action needs authorization and can itself fail.

## 05 — A cache is a performance layer, not an authority

Separate caches serve process-local metadata, distributed reads, parsed documents, retrieval results, approved answers, and inference prefixes. Each uses a different correctness contract and rebuild strategy.

A key incorporates the relevant tenant, permission scope, object and source versions, authorization epoch, model or parser version, and purpose. Private conversation content remains employee- and conversation-scoped. Cross-user reuse requires demonstrated permission equivalence.

Balances, payment status, and execution preconditions do not become authoritative because a semantic answer cache recognizes a similar question. Prefix reuse saves prefill work, not output decoding, and the gateway controls isolation salts. Cache failure triggers bounded source reads, circuit breakers, and controlled rebuilding. It never erases the operation ledger or restores an obsolete permission grant.

## 06 — Schedule work, contain failure

Business scheduling and inference scheduling solve different problems. The former allocates dependencies, human waits, parsing tasks, and deadlines. The latter allocates prefill, decode, batches, and accelerator memory.

Tenant budgets, weighted fair queues, admission control, and shared retry limits prevent a document batch or failing connector from starving interactive and operational work. Strict cost limits use transactional reservations.

Office, sensitive-office, and infrastructure workloads can occupy separate execution cells with independent queues, workers, capacity, and selected dependencies. A cell boundary is credible only if shared model, storage, identity, or database dependencies do not recreate the same failure domain. Recovery starts with durable state and source-system reconciliation; warming caches comes later.

## 07 — Portability is a tested contract

Portable application services and vendor-bound inference services require different strategies. A musl build can reduce dependence on host glibc versions when the CPU instruction set, kernel interfaces, native dependencies, and application behavior are compatible. It does not translate instruction sets or make proprietary accelerator drivers compatible.

Keep Python, Node, and accelerator libraries in vendor-supported environments. Move suitable connectors or small gateways to portable builds when dependency audits justify it. HTTP, RPC, and versioned schemas provide the stable boundary above heterogeneous systems.

Neural migration covers weights, operators, runtime, preprocessing, postprocessing, and quality. ASR requires equivalent sampling, segmentation, domain vocabulary, and speaker behavior. OCR requires comparable orientation, coordinates, reading order, and table structure. Vision-language models require matching image preparation, visual tokens, templates, and projection components.

The migration sequence is inventory, representative baseline, operator analysis, input/output parity, accuracy comparison, target-device optimization, shadow/canary traffic, and reversible rollout. Measure CPU fallback, host/device copies, peak memory, and successful-task latency. Embedding changes require parallel versioned indexes; vectors from different embedding spaces cannot be mixed merely because their dimensions match.

## Quantitative assumptions, made explicit

| Decision | Assumption | Modeled effect | Acceptance constraint |
| --- | --- | --- | --- |
| Parallel department reads | 0.8 + 1.2 + 0.6 seconds; 0.2-second aggregation | 2.6 → 1.4 seconds, about 46% lower | Independent queries; upstream capacity allows concurrency |
| Authorized read cache | 80% hits; 2 ms hit; 200 ms miss; 20 ms authorization | 220 → 61.6 ms mean, about 72% lower | P95 measured separately; authorization stays current |
| Reuse document parsing | Ten identical 300-second parses; nine 2-second reads after reuse | 3,000 → 318 compute-seconds, about 89% lower | Same content and parser configuration; access remains scoped |
| Prefix reuse | 1.5 s prefill, 3 s decode, 0.5 s other; prefill reduced 80% | 5 → 3.8 seconds, 24% lower end to end | Compatible runtime; isolated scope; unchanged answer quality |
| Pipeline acceleration | 70% neural stage accelerated 2×; 30% unchanged | About 1.54× overall speed | Includes preprocessing, transfers, and postprocessing |

These gains use different denominators and cannot be added into a platform-wide improvement percentage. Benchmark cold, warm, mixed, and degraded workloads with fixed permissions, data versions, models, output lengths, hardware, and success criteria. Report quality, cost per accepted task, throughput, and P50/P95/P99 together.

## Delivery gates

Start with inventory and reproducible builds. Establish identity, governed spaces, durable metadata, and revocation. Add data contracts and verifiable execution. Introduce caching, scheduling, and isolation against demonstrated bottlenecks. Validate target hardware and recovery through staged rollout.

Release requires isolation tests, reconciled side effects, explicit unresolved outcomes, version-bound approvals, reproducible model comparisons, and recovery drills.

**The strongest architecture is the one whose behavior remains explainable when permissions change, workers fail, and the source system answers late.**

## Selected implementation references

- [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Temporal workflow definitions](https://docs.temporal.io/workflow-definition)
- [Transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
- [vLLM prefix caching](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/)
- [musl compatibility](https://wiki.musl-libc.org/compatibility.html)
- [ONNX Runtime execution providers](https://onnxruntime.ai/docs/execution-providers/)

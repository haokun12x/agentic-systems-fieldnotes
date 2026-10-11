# Systems Fieldnotes — implementation notes

Reviewed 2026-10-11. This public brief describes an inspected application and its pinned dependencies without publishing its private repository, endpoints, credentials, or production data. Browser scenarios are synthetic reconstructions of code contracts, not recorded production runs. This is a source review, not a live deployment certification.

## Backend implementation routes

The system architecture is expressed as contracts: authorized context, adaptive model/tool decisions, observations, optional planning and delegation, scoped state/workspaces, recovery, and streamed user-facing output. LangGraph is one supported backend route and is used by the inspected application. A custom Rust runtime can implement the same requirements, while providing workload-specific execution and resource policies.

The Rust route maps those requirements to model clients, a typed action/tool registry, scoped storage adapters, versioned continuations, and transport. For more demanding scenarios it can add bounded asynchronous fan-out, tenant admission budgets, durable commits, worker leases/fencing, and reconciliation of uncertain external effects. These guarantees depend on their implementation and validation in either route.

The included executable Rust kernel establishes selected execution semantics: typed dispatch, shared snapshots, reducers, checkpoint compatibility, bounded cycles, and an uncertainty ledger. A complete service adds the adaptive model loop, real clients, durable storage, asynchronous workers, and UI transport. To retain the current React SDK, its Rust transport adapter must implement the expected thread/run, messages/values, cancellation, and error contracts; a custom API requires a corresponding frontend adapter.

## 1. What drives the Agent

The application constructs one Deep Agent from a model connection, orchestrator and delegation instructions, registered tools, a composite file backend, and a custom transcription-processing subagent. Deep Agents 0.2.8 supplies planning, filesystem, general-purpose delegation, and context-management middleware. The checked lockfile also pins LangChain 1.3.13 and LangGraph 1.2.9.

The controlling loop is model → tool calls → observations → model. The model decides whether to call a tool, change arguments, revise a plan, delegate, or answer. A todo list is optional mutable task state, not a compiled business workflow. A weak metadata hit can cause another search; a reader error can lead to a narrower request or an explicit evidence gap. A prompt guides these decisions but does not guarantee a particular trajectory.

Two application profiles expose ten registered departments. Each department selects a process, conversation store, workspace, and knowledge root. The Agent construction and tool registry are shared. Four configured model connections use an OpenAI-compatible adapter: self-hosted DeepSeek, DeepSeek API, a Llama-compatible endpoint, and a Qwen-compatible endpoint. Initialization chooses the connection; the application does not dynamically route every query to a different model.

Model adaptation and transport recovery are different mechanisms. The business connector refreshes an rejected service token and repeats the affected call once. ASR/OCR helpers default to three attempts with backoff; HTTP 4xx errors stop immediately. The UI's 999-step graph ceiling is not a per-task deadline or a general tool-retry budget.

Implementation anchors: `create_deep_agent`, `all_tools`, `CompositeBackend`, `SYSTEM_PROFILES`, model initialization, retrieval guidance, audio/PDF enrichment adapters.

## 2. Three storage contracts

| Virtual path | Implementation | Purpose and lifetime |
| --- | --- | --- |
| Root files such as `/plan.md` | StateBackend | Drafts and reports in graph state; available to subsequent steps in the conversation and persisted according to the checkpointer. |
| `/workspace/` | FilesystemBackend | Uploaded bytes and derived sidecars in a department/thread disk directory. Workspace TTL defaults to zero, disabling automatic expiry. |
| `/knowledge/` | Read-only filesystem wrapper | Approved reference material; Agent writes, edits, and uploads are rejected. |

“In memory” is an access model, not a promise of volatile RAM-only storage. The inspected development runtime periodically saves local checkpoint files. A restart can recover flushed state, while recent unflushed state can be lost. This is not replicated production durability. Disk files have a separate deletion/retention lifecycle; checkpoint and filesystem writes are not one transaction.

The explicit reflection tool returns a conversation message. Draft-writing tools update file state. Neither contract establishes exposure or persistence of the model's private internal reasoning.

The Agent does not expose an arbitrary shell: the selected backend does not implement the sandbox execution protocol. Controlled application adapters can invoke Pandoc or ffmpeg using real OS files. To process a state-backed draft with a CLI, the application must materialize bytes into a temporary file first.

Report export is concrete: the browser sends selected content to `/api/export`; the server writes temporary Markdown, calls Pandoc and the configured PDF engine, returns download bytes, and cleans up. This is a UI service, not a registered model-callable export tool. The export handler receives browser-supplied content and does not resolve an authorized saved artifact by thread ID.

A local single-user Agent can inherit its user's directory and OS identity. A shared service must resolve caller, department, and thread first. Path routing supplies an application boundary; OS permissions, execution isolation, and service credentials remain independent concerns.

## 3. Six concrete request paths

| Request | Existing path | Boundary |
| --- | --- | --- |
| Internal news brief | Search indexed workspace/knowledge metadata, read candidates, check dates, summarize with sources. | No registered live feed, scheduled ingestion, or subscription. Metadata ranking is lexical; no hybrid-vector pipeline is claimed. |
| Report and PDF | Read evidence, write a report in state, render it in the file panel; user invokes server-side export. | Export failure returns to the UI; it does not automatically trigger Agent replanning. |
| Uploaded Word | Authorized upload to disk; extract paragraphs/tables into a Markdown sidecar and metadata index; search and read that sidecar. | A bounded direct reader reports truncation. Editing a new draft is not tracked-change editing of the original binary. |
| Voice | Microphone → UI ASR route → editable composer text → user submission. Alternatively, uploaded audio → Agent transcription tool → optional transcript subagent. | Dictation service and model-callable transcription are separate. No implemented TTS output is claimed. |
| Database-like requests | Dataset metadata, filtered reads, and aggregates through a service adapter. | No SQL connector or insert/update/delete tool is registered. A write request requires a new authorized capability. |
| Business API | Catalog discovery, deterministic candidate scoring or explicit selection, argument/filter preparation, query, pagination, normalized results. | Token refresh retries the call once on the recognized authentication rejection. Returned sample size and fetched total are different. |

## 4. Authorization, departments, and scheduling

For registered department requests, the frontend proxy checks origin, verifies the department entry password using scrypt and constant-time comparison, derives an owner from a random HttpOnly browser identity and department scope, restricts proxy routes, and verifies thread ownership. A missing or foreign thread returns 404. Global unscoped runs and store routes are not exposed through the allowed thread API. Workspace routes similarly authorize the thread before resolving a disk root.

These are browser-bound conversations and department entry credentials, not employee SSO or shared multi-user collaboration. The unregistered legacy-target compatibility path has a different contract. A subagent is not authorized to cross department boundaries merely because it receives a task.

The current registry maps a department to a fixed backend. Separate processes are not a central capacity scheduler. No application-level fair queue, automatic cache-aware worker selection, or KV reservation manager is wired into the inspected system.

The scheduling exhibit is an explicit extension: filter candidates by scope, model compatibility, and memory reservation; then compare queue wait plus uncached prefill cost. Its fixed millisecond and KV-block numbers are teaching inputs, not benchmarks. Production queues for UI/API, Agent tasks, tool services, and model inference should have separate capacity policies.

Cross-department coordination is likewise an extension: request separately authorized minimal evidence from each department, preserve provenance, and recheck access on delivery. No existing automatic cross-department handoff is asserted.

## 5. Two independent compatibility layers

**Neural computation:** the Agent talks to a compatible model endpoint. Adapting the model server to an NPU requires operator/compiler support, drivers, memory layouts, supported precision, and validation of both task quality and device performance. An HTTP-compatible endpoint alone does not prove the model was ported successfully.

**Application software:** the observed container uses Ubuntu and packages Python, Node, converters, and native dependencies. Containers package user space; Kubernetes manages deployment and capacity. A musl-linked native helper can run without a container when its CPU ISA, Linux kernel requirements, dependencies, and operational controls match. musl is not an ISA translator, NPU driver, or a replacement for the application's Python/Node ecosystem. Kubernetes manifests, a musl build of the full application, ARM validation, and Ascend integration are not verified deliverables of the inspected source.

## 6. LangGraph-route packets and frontend separation

The UI uses LangGraph SDK `useStream` with message, todo, file, and optional UI state. Submission sends a human message, optional file changes, and run configuration. The initial `/threads/{thread_id}/runs/stream` request is a POST that returns SSE; it is not a custom 202-then-GET handshake.

Message chunks are assembled into assistant output. Tool calls carry names and arguments; ToolMessage results are matched by `tool_call_id`. Values updates feed todo and file panels. A delivered tool result is not automatically a successful business operation. The proxy forwards the upstream stream; it is not a separate sanitizer or event projector.

The SDK supports joining an existing run, and the proxy forwards Last-Event-ID. That does not establish an application-owned, gap-free replay log with a custom sequence number and retention contract. The optional event envelope and outbox are design extensions. The executable Rust kernel is the foundation of an alternative backend route, with full-service integration distinguished from its implemented semantics.

## Public technical references

- [Pinned Deep Agents construction](https://github.com/langchain-ai/deepagents/blob/deepagents%3D%3D0.2.8/libs/deepagents/deepagents/graph.py)
- [Deep Agents backends](https://docs.langchain.com/oss/python/deepagents/backends)
- [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- [vLLM prefix-cache design](https://docs.vllm.ai/en/latest/design/prefix_caching/)
- [musl design and scope](https://musl.libc.org/about.html)

Current documentation can describe newer versions. Implementation statements above use the inspected source and pinned runtime, with extension targets labeled separately.

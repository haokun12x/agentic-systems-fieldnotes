# Enterprise Agentic Systems — Acceptance Checklist

**56 planned verification gates. This document is not proof of passed production tests.**

The unchecked items below define the enterprise delivery plan. The existing application foundation and these proposed controls have different evidence requirements. A checked item must link to a reproducible test and observed result for a specified release, rather than an architecture diagram or component installation.

## Define the target matrix before testing

Record the supported workload and deployment matrix:

- **Identity and scope:** employees, device sessions, service identities, tenants, departments, personal and project spaces, classifications, and delegation paths.
- **Workloads:** cross-department analysis, scheduled news briefs, rail infrastructure assistance, document parsing, speech processing, and concurrent collaboration.
- **Data and models:** source-system contracts, schema and index versions, observation times, model identifiers and digests, preprocessing, precision, context length, and output limits.
- **Platforms:** CPU instruction set, operating system, libc, native libraries, database engine, accelerator, driver, firmware, compiler, and inference runtime.
- **Load and faults:** cold and warm caches, mixed concurrency, peak arrivals, source slowdown, permission changes, duplicate delivery, worker failure, lost responses, and cell or regional failure.
- **Acceptance thresholds:** task correctness, sensitive-data isolation, revocation deadlines, latency percentiles, successful-task cost, throughput, and recovery objectives for each workload.

Retain the test owner, fixture version, expected behavior, actual result, release manifest, sanitized traces, operation identifiers, source receipts, quality scores, timing distributions, and recovery evidence. Keep secrets and private content out of public artifacts. Evidence from one hardware, model, or permission configuration does not automatically qualify another. For external side effects, document the source system's idempotency, result-query, and reconciliation contract; an unresolvable outcome remains unresolved and requires an explicit human route.

## B1 — Identity and authorization

- [ ] **01.** Employee accounts, device sessions, and workload identities are modeled separately.
- [ ] **02.** Clients cannot forge tenant, employee, delegation, or authorization-epoch context.
- [ ] **03.** A shared department credential cannot access an employee's private information.
- [ ] **04.** Transfers, departures, and project exits revoke access within the defined deadlines.
- [ ] **05.** A lower-privilege coordinating agent cannot acquire additional authority through a higher-privilege subagent.
- [ ] **06.** An independent departmental handoff identifies the accountable business principal and review owner.
- [ ] **07.** An authorization-service failure cannot return an obsolete permission grant for sensitive content.
- [ ] **08.** Department backends, model endpoints, and source databases cannot bypass the governed access boundary.

## B2 — Workspaces and conversations

- [ ] **09.** Private conversations and shared project conversations have independent access policies.
- [ ] **10.** Project members cannot read another person's private uploads or summaries.
- [ ] **11.** A new conversation does not implicitly import messages from another conversation.
- [ ] **12.** File previews, downloads, exports, and search titles all enforce authorization.
- [ ] **13.** Derived text, indexes, vectors, caches, and memory retain their source access restrictions.
- [ ] **14.** Sharing links enforce classification and expiration policies.
- [ ] **15.** Path traversal, symbolic-link escape, and archive extraction outside the allowed namespace are blocked.
- [ ] **16.** Concurrent edits produce an explicit conflict instead of silently overwriting another edit.
- [ ] **17.** An older run cannot publish an official artifact using obsolete input versions.
- [ ] **18.** Publishing personal work to a project fixes the content, destination, provenance, and audit record.

## B3 — Data and retrieval

- [ ] **19.** Every cross-department data product identifies its authoritative source, permitted fields, and owner.
- [ ] **20.** Row and field permissions are enforced before content reaches the model.
- [ ] **21.** Master identifiers, monetary units, currencies, and time-zone conventions are consistent.
- [ ] **22.** Controlled queries reject write statements, identity-changing session commands, and unauthorized file or network extensions.
- [ ] **23.** Pooled connections cannot reuse the previous request's identity context.
- [ ] **24.** Source observation times and change-data-capture watermarks are visible; combined reads are not falsely represented as a global snapshot.
- [ ] **25.** Index updates, deletions, and revocations expose verifiable processing watermarks.
- [ ] **26.** Old and new embedding spaces remain separate, and rollback preserves revocations.

## B4 — Conversations, caches, and scheduling

- [ ] **27.** User messages and accepted tasks are durably recorded before acknowledgment.
- [ ] **28.** Server-sent-event reconnection, repeated submissions, and out-of-order events do not duplicate messages.
- [ ] **29.** Summaries preserve unresolved outcomes, pending approvals, and deterministic business facts.
- [ ] **30.** Users with different permissions do not share a sensitive cached answer merely because they ask the same question.
- [ ] **31.** Complete cache loss triggers bounded source concurrency without losing durable task state.
- [ ] **32.** The gateway controls KV-cache isolation salts and prevents cross-scope reuse.
- [ ] **33.** Batch parsing cannot exhaust resources reserved for interactive questions and rail infrastructure assistance.
- [ ] **34.** Cost reservation, settlement, release, and retries use stable identifiers and enforced limits.

## B5 — Execution and recovery

- [ ] **35.** Action proposals bind the exact business objects, parameters, and supporting evidence.
- [ ] **36.** Approval and the actual send intent remain durably linked through recovery.
- [ ] **37.** Changes to approved amounts, content, or objects trigger renewed validation and approval where required.
- [ ] **38.** A timeout enters an unknown-outcome state instead of blindly repeating a high-impact action.
- [ ] **39.** A source-side success followed by a lost response does not create duplicate effects under the qualified source-system recovery contract.
- [ ] **40.** Consumers deduplicate repeated outbox deliveries.
- [ ] **41.** Failed compensating actions have a named owner and an explicit manual-resolution route.
- [ ] **42.** A resumed older worker cannot bypass fencing or object-version checks.
- [ ] **43.** Parent-task cancellation defines the handling of child tasks, late results, and operations already in flight.
- [ ] **44.** Shadow runs, branch debugging, and audit inspection cannot trigger real business writes.

## B6 — Disaster recovery and release

- [ ] **45.** Cell-failure impact and shared-dependency behavior match the documented isolation boundary.
- [ ] **46.** Disaster-recovery cutover prevents concurrent writers and reconciles external business facts before reopening writes.
- [ ] **47.** Data, operation ledgers, files, and caches each meet their separately defined recovery objectives.
- [ ] **48.** Deletion, revocation, and approval-invalidation records remain effective after recovery.
- [ ] **49.** The complete release manifest, canary process, and version pinning for long-running tasks are verified.

## B7 — Target-platform compatibility and models

- [ ] **50.** The actual operating system, instruction set, libc, driver, firmware, and device models are registered.
- [ ] **51.** Native dependencies and images run on the target architecture and pass the relevant regression suite.
- [ ] **52.** The scope of musl-compatible modules is explicit; unsupported vendor runtime stacks are not replaced or mixed.
- [ ] **53.** Selected domestic database engines pass transaction, locking, monetary precision, time-zone, backup, and restore tests.
- [ ] **54.** ASR, OCR, and vision-language pipelines meet preprocessing, postprocessing, critical-field, and target-device quality requirements.
- [ ] **55.** Quantization, operator behavior, CPU fallback, and end-to-end performance have reproducible records.
- [ ] **56.** Offline artifacts, models, fonts, licenses, staged rollout, and rollback are verified.

## Using this checklist

Keep each checkbox open until its evidence has been reviewed for the stated matrix. Record exceptions as explicit scope restrictions with owners and expiration dates. Re-run affected gates when a permission model, source contract, parser, model, dependency, device runtime, or recovery procedure changes. Passing a demonstration does not substitute for testing the complete information and execution path.

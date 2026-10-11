# A runtime is an interpreter, not a prompt wrapper

This dependency-free Rust reference implements a small, inspectable execution kernel. It supports the portfolio's runtime discussion with code that can actually be compiled and tested. It is an educational implementation of selected execution semantics, not a claim that an enterprise distributed engine has been delivered in Rust.

## Run it

With a Rust compiler (Rust 2021 edition; verified using the compiler pinned in `pixi.lock`):

```sh
rustc --edition=2021 main.rs -o runtime-kernel
./runtime-kernel
rustc --edition=2021 --test main.rs -o runtime-tests
./runtime-tests
```

If no compiler is installed, the included `pixi.toml` and `pixi.lock` provide an isolated Linux environment:

```sh
pixi install
pixi run demo
pixi run test
```

The source uses only Rust's standard library. No framework, network service or API key is required. The demo creates no real work order and connects to no real provider.

## Read the layers from the outside in

| Layer | Responsibility in this example | Production extension |
| --- | --- | --- |
| Function value | `Arc<dyn Fn(...)>` stores an executable closure. Passing it and invoking it are different operations. | Adapter-specific clients, bounded resources, typed I/O contracts. |
| Invocation context | Read-only principal, tenant/workspace/conversation scope, capability snapshot, deadline and cooperative cancellation. | Trusted authenticated construction, current authorization checks, short-lived credentials. |
| State machine | Nodes return state deltas, next node IDs and effect intents. | Validated schemas, conditional routes and explicit dependency readiness. |
| Graph interpreter | Every task in a superstep reads the same snapshot. A barrier merges deltas and determines the next frontier. | Real parallel workers, queue fairness, backpressure, leases and fencing. |
| Checkpoint boundary | A checkpoint holds state, pending node IDs, code/schema versions, scope binding and remaining fuel. | Durable atomic storage, input/output logs, migrations, retention and encryption. |
| Effect interpreter | A separate ledger tracks `Prepared → Sent → Unknown → Confirmed`; uncertainty requires reconciliation. | Provider idempotency, authoritative status lookup, transactional Outbox and manual resolution. |

The kernel invokes nodes sequentially to keep the artifact easy to inspect. Its fan-out is **logical concurrency**: siblings see the same input version. The code does not claim parallel speedup. Rust ownership supports safe sharing; it does not create a scheduler, database transaction, sandbox or exactly-once delivery.

## How a function travels

```rust
type NodeFn = Arc<dyn Fn(&State, &RunContext)
    -> Result<Transition, KernelError> + Send + Sync>;
```

`Fn` defines the callable input/output contract. `dyn` allows differently shaped closures behind one registry interface. `Arc` shares ownership of a function value. `Send + Sync` are compiler-checked requirements for cross-thread use. A closure can capture configuration before it is registered, then receive a fresh state reference and context on each call.

The graph persists stable `NodeId` values. A worker resolves an ID against its versioned local registry and calls the corresponding function. A checkpoint never serializes a closure, stack frame, pointer, live future or process-local clock instant. A production registry should verify signed code or artifact digests; the human-readable revision strings here are illustrative and must be updated honestly when code changes.

Although the interface supplies immutable references, an arbitrary Rust closure could still perform network I/O, mutate global state, panic or never return. `Fn + Send + Sync` is not a purity or idempotency proof. The example nodes follow a discipline: compute deltas and intents; delegate external execution to an adapter. Process isolation, resource enforcement and vetted adapters establish the real trust boundary.

## Why the barrier matters

The demo graph is:

```text
plan ──┬── legal ──────┐
       └── operations ├── join ── effect intent
                      ┘
```

1. `plan` scopes the request and schedules two nodes.
2. Both branches read the same committed state. Neither can observe a sibling's delta during that superstep.
3. The barrier applies a set-union reducer to publish both findings.
4. Both branches schedule `join`; the frontier's set deduplicates that same node ID.
5. `join` verifies that both findings exist, then emits a draft intent.

In this reference, a node's `halt` flag requests a **global** stop after the barrier. All successful sibling deltas and intents in that round still participate in the barrier. A different application may require branch-local completion and must define that policy explicitly.

Set union is associative, commutative and idempotent. Therefore these facts do not depend on which branch finishes first. That algebraic property applies to this reducer, not to arbitrary writes. A list append needs canonical ordering; a scalar overwrite needs an explicit conflict policy. A general graph with branches of different lengths also needs dependency readiness or guards: a successor name alone is not a proof that a join is ready.

Failure before the barrier leaves state and intents unpublished. The reserved invocation slots still consume logical fuel. In production, state, pending tasks and intents must be committed together, with attempt accounting designed explicitly; this in-memory example cannot provide crash consistency.

## The useful part of category theory

For pure, total functions, composition is `g ∘ f = |a| g(f(a))`. Identity leaves a value unchanged, and associativity allows regrouping without changing the result. The tests demonstrate those laws on simple terminating functions.

An effectful node has a richer shape: `State × Context → Result<Transition, Error>`. `Transition` carries updated-data intent, routing and external-effect intent. An interpreter must specify how it propagates errors, supplies context and combines deltas. In this example it does so explicitly; the code does not claim to implement a general monad library or a full category for every Rust closure. Real closures can diverge or panic, so the total-function assumptions must be stated.

This is useful engineering vocabulary because it identifies which transformations are safe. It does not make two external tool calls interchangeable, and it does not make retries harmless.

## What computation theory changes in operations

A graph can have cycles. For a general program the runtime cannot decide in advance whether it terminates. This kernel instead enforces finite supersteps, reserved-invocation fuel and checks for a deadline/cancellation before and between returning node calls. It also supports a state stop predicate.

Those are operational bounds, not a solution to the halting problem. They cannot interrupt a stuck synchronous closure or prevent it from allocating unlimited memory. Production enforcement requires worker/process boundaries, resource limits and bounded adapter calls. A runtime restart also needs a persisted wall-clock deadline or recomputed remaining allowance; a process-local `Instant` must not be restored from a checkpoint.

## External uncertainty is a first-class state

After an external call is sent, an acknowledgement can be lost even if the provider completed the action. The safe state is `Unknown`, not success or failure. The ledger refuses a second send until reconciliation produces either an authoritative receipt or definitive proof of non-execution. A temporary 404 from an eventually consistent index is not that proof.

The demo models the ledger in memory. It has no provider call, durable transaction, approval service or real authorization refresh. Its capability check must be replaced or supplemented by current server-side authorization at dispatch. When an authorization epoch changes, checkpoint validation rejects resumption; a real service must explicitly reauthorize or migrate the run rather than silently reuse old rights.

## Verification and limits

The 13 included tests verify function composition laws, captured-function invocation, order-independent/idempotent reduction, shared branch snapshots, join deduplication, code-version mismatch, scope/authorization-epoch mismatch, cancellation/deadlines, graph-edge validation, missing capabilities, cycle bounds, barrier failure behavior, operation-payload binding and lost-acknowledgement reconciliation.

Implemented: typed in-process execution, function registry, state/frontier/version checkpoint model, graph-edge validation, bounded cycles, intent separation and a demonstrable uncertainty protocol.

Not implemented: distributed workers, durable persistence, arbitrary checkpoint serialization, streaming, nested graphs, interrupts/approval UX, true general join scheduling, thread-level parallel execution, process isolation, transport security, database-backed authorization, GPU inference or performance benchmarks. The browser's runtime inspector is a teaching simulation, not execution of this Rust binary.

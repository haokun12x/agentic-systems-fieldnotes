//! A dependency-free reference interpreter for durable graph semantics.
//! It is an executable teaching artifact, not a distributed production runtime.
//! rustc --edition=2021 main.rs -o runtime-kernel && ./runtime-kernel
//! rustc --edition=2021 --test main.rs -o runtime-tests && ./runtime-tests

use std::collections::{BTreeMap, BTreeSet};
use std::sync::{atomic::{AtomicBool, Ordering}, Arc};
use std::time::{Duration, Instant};

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
struct NodeId(String);
impl NodeId { fn new(name: &str) -> Self { Self(name.into()) } }

#[derive(Clone, Debug, Default, PartialEq, Eq)]
struct State { facts: BTreeSet<String> }

/// The reducer is associative, commutative and idempotent: a ∪ b = b ∪ a.
/// That property removes completion-order sensitivity for these particular facts.
/// It does NOT make arbitrary application writes or external effects idempotent.
#[derive(Clone, Debug, Default)]
struct StateDelta { facts: BTreeSet<String> }
impl StateDelta {
    fn fact(value: &str) -> Self {
        Self { facts: [value.into()].into_iter().collect() }
    }
    fn merge_into(self, state: &mut State) { state.facts.extend(self.facts); }
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct Scope { tenant: String, workspace: String, conversation: String }

/// Injected by the caller; nodes cannot replace this invocation's identity.
/// The flag is cooperatively read. It cannot preempt a blocked or malicious node.
#[derive(Clone)]
struct RunContext {
    principal: String,
    scope: Scope,
    capability_epoch: u64,
    capabilities: BTreeSet<String>,
    deadline: Instant,
    cancelled: Arc<AtomicBool>,
}
impl RunContext {
    fn check_live(&self) -> Result<(), KernelError> {
        if self.cancelled.load(Ordering::Acquire) { return Err(KernelError::Cancelled); }
        if Instant::now() >= self.deadline { return Err(KernelError::DeadlineExceeded); }
        Ok(())
    }
    fn require(&self, capability: &str) -> Result<(), KernelError> {
        self.check_live()?;
        if self.capabilities.contains(capability) { Ok(()) }
        else { Err(KernelError::Unauthorized(capability.into())) }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct EffectIntent {
    operation_id: String,
    payload: String,
    capability: String,
}

#[derive(Clone, Debug, Default)]
struct Transition {
    delta: StateDelta,
    next: BTreeSet<NodeId>,
    effects: Vec<EffectIntent>,
    halt: bool,
}
impl Transition {
    fn to(fact: &str, next: &[&str]) -> Self {
        Self {
            delta: StateDelta::fact(fact),
            next: next.iter().map(|name| NodeId::new(name)).collect(),
            ..Self::default()
        }
    }
}

/// A function value can be passed around without being called immediately.
/// Arc shares ownership; dyn erases the concrete closure type; Send + Sync permit
/// cross-thread use. None of those properties provides a security sandbox.
/// Nodes return data + intents. The engine decides when updates become visible.
type NodeFn = Arc<dyn Fn(&State, &RunContext) -> Result<Transition, KernelError> + Send + Sync>;
struct RegisteredNode { revision: String, function: NodeFn }

#[derive(Clone, Debug, PartialEq, Eq)]
struct VersionContract {
    state_schema: String,
    graph_revision: String,
    node_revisions: BTreeMap<NodeId, String>,
}

/// Only names, data and versions belong in a durable checkpoint. Closures,
/// pointers, thread handles and process-local Instant values never belong here.
/// This demo keeps the checkpoint in RAM; a real adapter must encode and commit
/// it atomically with intent records before acknowledging the barrier.
#[derive(Clone, Debug)]
struct Checkpoint {
    version: VersionContract,
    principal: String,
    scope: Scope,
    capability_epoch: u64,
    state: State,
    pending: BTreeSet<NodeId>,
    superstep: u32,
    fuel_remaining: usize,
    intents: BTreeMap<String, EffectIntent>,
    finished: bool,
}

#[derive(Debug, PartialEq, Eq)]
enum KernelError {
    Cancelled,
    DeadlineExceeded,
    Unauthorized(String),
    BudgetExhausted,
    StepLimitExceeded,
    VersionMismatch,
    ScopeMismatch,
    MissingNode(String),
    IllegalEdge(String, String),
    IntentConflict(String),
    NodeFailure(String),
    InvalidEffectState,
    PendingReconciliation,
}

struct Kernel {
    nodes: BTreeMap<NodeId, RegisteredNode>,
    edges: BTreeMap<NodeId, BTreeSet<NodeId>>,
    state_schema: String,
    graph_revision: String,
    max_supersteps: u32,
    stop: fn(&State) -> bool,
}
impl Kernel {
    fn new(revision: &str, max_supersteps: u32, stop: fn(&State) -> bool) -> Self {
        Self { nodes: BTreeMap::new(), edges: BTreeMap::new(), state_schema: "facts/v1".into(),
            graph_revision: revision.into(), max_supersteps, stop }
    }
    fn register<F>(&mut self, id: &str, revision: &str, function: F)
    where F: Fn(&State, &RunContext) -> Result<Transition, KernelError> + Send + Sync + 'static {
        self.nodes.insert(NodeId::new(id), RegisteredNode { revision: revision.into(), function: Arc::new(function) });
    }
    fn edge(&mut self, from: &str, to: &str) {
        self.edges.entry(NodeId::new(from)).or_default().insert(NodeId::new(to));
    }
    fn version(&self) -> VersionContract {
        VersionContract { state_schema: self.state_schema.clone(), graph_revision: self.graph_revision.clone(),
            node_revisions: self.nodes.iter().map(|(id, node)| (id.clone(), node.revision.clone())).collect() }
    }
    fn start(&self, context: &RunContext, initial: State, entry: &str, fuel: usize) -> Result<Checkpoint, KernelError> {
        context.check_live()?;
        if !self.nodes.contains_key(&NodeId::new(entry)) { return Err(KernelError::MissingNode(entry.into())); }
        Ok(Checkpoint { version: self.version(), principal: context.principal.clone(), scope: context.scope.clone(),
            capability_epoch: context.capability_epoch, state: initial, pending: [NodeId::new(entry)].into_iter().collect(),
            superstep: 0, fuel_remaining: fuel, intents: BTreeMap::new(), finished: false })
    }
    fn validate(&self, checkpoint: &Checkpoint, context: &RunContext) -> Result<(), KernelError> {
        context.check_live()?;
        if checkpoint.version != self.version() { return Err(KernelError::VersionMismatch); }
        if checkpoint.principal != context.principal || checkpoint.scope != context.scope ||
            checkpoint.capability_epoch != context.capability_epoch { return Err(KernelError::ScopeMismatch); }
        Ok(())
    }
    fn step(&self, checkpoint: &mut Checkpoint, context: &RunContext) -> Result<(), KernelError> {
        self.validate(checkpoint, context)?;
        if checkpoint.finished { return Ok(()); }
        if checkpoint.superstep >= self.max_supersteps { return Err(KernelError::StepLimitExceeded); }
        if checkpoint.pending.len() > checkpoint.fuel_remaining { return Err(KernelError::BudgetExhausted); }

        // Reserve invocation slots for the whole superstep, including failed steps.
        // This is NOT a CPU-time or memory limit. A blocked closure needs process isolation.
        checkpoint.fuel_remaining -= checkpoint.pending.len();
        let snapshot = &checkpoint.state;
        let mut transitions = Vec::new();
        for id in &checkpoint.pending {
            context.check_live()?;
            let node = self.nodes.get(id).ok_or_else(|| KernelError::MissingNode(id.0.clone()))?;
            let transition = (node.function)(snapshot, context)?;
            for next in &transition.next {
                if !self.nodes.contains_key(next) { return Err(KernelError::MissingNode(next.0.clone())); }
                if !self.edges.get(id).is_some_and(|edges| edges.contains(next)) {
                    return Err(KernelError::IllegalEdge(id.0.clone(), next.0.clone()));
                }
            }
            transitions.push(transition);
        }
        context.check_live()?;
        let mut next_state = checkpoint.state.clone();
        let mut next_tasks = BTreeSet::new();
        let mut next_intents = checkpoint.intents.clone();
        let mut halt = false;
        for transition in transitions {
            transition.delta.merge_into(&mut next_state);
            next_tasks.extend(transition.next);
            halt |= transition.halt;
            for intent in transition.effects {
                context.require(&intent.capability)?;
                if let Some(previous) = next_intents.get(&intent.operation_id) {
                    if previous != &intent { return Err(KernelError::IntentConflict(intent.operation_id)); }
                } else { next_intents.insert(intent.operation_id.clone(), intent); }
            }
        }
        // Superstep barrier: no node saw a sibling's uncommitted update.
        // State, pending work and intents must share one durable transaction in production.
        // Here `halt` is a global policy: any node requests an end after this barrier.
        let finished = halt || next_tasks.is_empty() || (self.stop)(&next_state);
        checkpoint.state = next_state;
        checkpoint.pending = if finished { BTreeSet::new() } else { next_tasks };
        checkpoint.intents = next_intents;
        checkpoint.superstep += 1;
        checkpoint.finished = finished;
        Ok(())
    }
    fn run(&self, checkpoint: &mut Checkpoint, context: &RunContext) -> Result<(), KernelError> {
        while !checkpoint.finished { self.step(checkpoint, context)?; }
        Ok(())
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
enum EffectStatus { Prepared, Sent, Unknown, Confirmed(String) }
#[derive(Clone, Debug)]
struct EffectRecord { intent: EffectIntent, status: EffectStatus, send_attempts: u32 }
#[derive(Default)]
struct EffectLedger { records: BTreeMap<String, EffectRecord> }
// All three outcomes belong to the adapter contract; tests exercise each outcome.
#[allow(dead_code)]
enum ProviderAnswer { Confirmed(String), DefinitelyAbsent, Indeterminate }
impl EffectLedger {
    fn prepare(&mut self, intent: EffectIntent, context: &RunContext) -> Result<(), KernelError> {
        // Real dispatch must query current authorization, not only an old snapshot.
        context.require(&intent.capability)?;
        if let Some(record) = self.records.get(&intent.operation_id) {
            if record.intent != intent { return Err(KernelError::IntentConflict(intent.operation_id)); }
            return Ok(());
        }
        self.records.insert(intent.operation_id.clone(), EffectRecord { intent, status: EffectStatus::Prepared, send_attempts: 0 });
        Ok(())
    }
    fn mark_sent(&mut self, id: &str, context: &RunContext) -> Result<(), KernelError> {
        let record = self.records.get_mut(id).ok_or(KernelError::InvalidEffectState)?;
        context.require(&record.intent.capability)?;
        match record.status {
            EffectStatus::Prepared => { record.status = EffectStatus::Sent; record.send_attempts += 1; Ok(()) },
            EffectStatus::Unknown => Err(KernelError::PendingReconciliation),
            _ => Err(KernelError::InvalidEffectState),
        }
    }
    fn lost_ack(&mut self, id: &str) -> Result<(), KernelError> {
        let record = self.records.get_mut(id).ok_or(KernelError::InvalidEffectState)?;
        if record.status != EffectStatus::Sent { return Err(KernelError::InvalidEffectState); }
        record.status = EffectStatus::Unknown;
        Ok(())
    }
    fn reconcile(&mut self, id: &str, answer: ProviderAnswer) -> Result<(), KernelError> {
        let record = self.records.get_mut(id).ok_or(KernelError::InvalidEffectState)?;
        if record.status != EffectStatus::Unknown { return Err(KernelError::InvalidEffectState); }
        record.status = match answer {
            ProviderAnswer::Confirmed(receipt) => EffectStatus::Confirmed(receipt),
            // Only authoritative proof of non-execution permits a fresh attempt.
            // A stale index or a temporary 404 is NOT that proof.
            ProviderAnswer::DefinitelyAbsent => EffectStatus::Prepared,
            ProviderAnswer::Indeterminate => EffectStatus::Unknown,
        };
        Ok(())
    }
}

/// Ordinary pure functions compose directly: (g ∘ f)(a) = g(f(a)).
/// Effectful nodes require an interpreter that threads context, errors and intents.
fn compose<A, B, C, F, G>(f: F, g: G) -> impl Fn(A) -> C
where F: Fn(A) -> B, G: Fn(B) -> C { move |a| g(f(a)) }

fn demo_context() -> RunContext {
    RunContext { principal: "engineer:demo".into(),
        scope: Scope { tenant: "sample".into(), workspace: "operations-review".into(), conversation: "thread-001".into() },
        capability_epoch: 7, capabilities: ["workorder:draft".into()].into_iter().collect(),
        deadline: Instant::now() + Duration::from_secs(30), cancelled: Arc::new(AtomicBool::new(false)) }
}
fn graph() -> Kernel {
    let mut kernel = Kernel::new("ops-review/v1", 8, |state| state.facts.contains("review complete"));
    kernel.register("plan", "v1", |_, _| Ok(Transition::to("request scoped", &["legal", "operations"])));
    kernel.register("legal", "v1", |state, _| {
        if state.facts.contains("operations checked") { return Err(KernelError::NodeFailure("sibling update leaked".into())); }
        Ok(Transition::to("legal checked", &["join"]))
    });
    kernel.register("operations", "v1", |state, _| {
        if state.facts.contains("legal checked") { return Err(KernelError::NodeFailure("sibling update leaked".into())); }
        Ok(Transition::to("operations checked", &["join"]))
    });
    kernel.register("join", "v1", |state, context| {
        if !state.facts.contains("legal checked") || !state.facts.contains("operations checked") {
            return Err(KernelError::NodeFailure("join requires both branches".into()));
        }
        context.require("workorder:draft")?;
        Ok(Transition { delta: StateDelta::fact("review complete"), effects: vec![EffectIntent {
            operation_id: "review-001:draft:v1".into(), payload: "Create one review draft; do not dispatch equipment".into(),
            capability: "workorder:draft".into() }], halt: true, ..Transition::default() })
    });
    for (from, to) in [("plan", "legal"), ("plan", "operations"), ("legal", "join"), ("operations", "join")] { kernel.edge(from, to); }
    kernel
}
fn main() -> Result<(), KernelError> {
    let context = demo_context();
    let kernel = graph();
    let mut checkpoint = kernel.start(&context, State::default(), "plan", 12)?;
    kernel.step(&mut checkpoint, &context)?;
    println!("Checkpoint after planning: pending {:?}; functions remain in the registry.", checkpoint.pending);
    // A fresh process would load data + versions, then resolve these names in its registry.
    // clone demonstrates resume semantics; it does not simulate a durable storage write.
    let mut resumed = checkpoint.clone();
    graph().run(&mut resumed, &context)?;
    println!("Barrier result: {:?}; supersteps={}; fuel_remaining={}", resumed.state.facts, resumed.superstep, resumed.fuel_remaining);
    let mut ledger = EffectLedger::default();
    let intent = resumed.intents.values().next().unwrap().clone();
    ledger.prepare(intent.clone(), &context)?;
    ledger.mark_sent(&intent.operation_id, &context)?;
    ledger.lost_ack(&intent.operation_id)?;
    let refused = ledger.mark_sent(&intent.operation_id, &context);
    println!("Lost ACK: {:?}. Blind resend is refused: {:?}.", ledger.records[&intent.operation_id].status, refused);
    ledger.reconcile(&intent.operation_id, ProviderAnswer::Confirmed("provider-receipt-734".into()))?;
    println!("Reconciled: {:?}; send_attempts={}", ledger.records[&intent.operation_id].status, ledger.records[&intent.operation_id].send_attempts);
    println!("Pure composition example: (double ∘ increment)(4) = {}", compose(|x: i32| x + 1, |x| x * 2)(4));
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn pure_function_composition_obeys_identity_and_associativity() {
        fn f(x: i32) -> i32 { x + 1 }
        fn g(x: i32) -> i32 { x * 2 }
        fn h(x: i32) -> i32 { x - 3 }
        for x in -8..8 {
            assert_eq!(compose(f, |v| v)(x), f(x));
            assert_eq!(compose(|v| v, f)(x), f(x));
            assert_eq!(compose(compose(f, g), h)(x), compose(f, compose(g, h))(x));
        }
    }
    #[test]
    fn reducer_is_associative_commutative_and_idempotent() {
        let reduce = |deltas: Vec<StateDelta>| { let mut state = State::default(); for delta in deltas { delta.merge_into(&mut state); } state };
        let a = StateDelta::fact("a"); let b = StateDelta::fact("b"); let c = StateDelta::fact("c");
        assert_eq!(reduce(vec![a.clone(), b.clone(), c.clone()]), reduce(vec![c, a.clone(), b.clone()]));
        assert_eq!(reduce(vec![a.clone(), a.clone(), b.clone()]), reduce(vec![a, b]));
    }
    #[test]
    fn fanout_reads_one_snapshot_and_duplicate_join_is_scheduled_once() {
        let context = demo_context(); let kernel = graph();
        let mut checkpoint = kernel.start(&context, State::default(), "plan", 12).unwrap();
        kernel.step(&mut checkpoint, &context).unwrap();
        kernel.step(&mut checkpoint, &context).unwrap();
        assert!(checkpoint.state.facts.contains("legal checked"));
        assert!(checkpoint.state.facts.contains("operations checked"));
        assert_eq!(checkpoint.pending, [NodeId::new("join")].into_iter().collect());
        kernel.run(&mut checkpoint, &context).unwrap();
        assert_eq!(checkpoint.superstep, 3); assert_eq!(checkpoint.fuel_remaining, 8);
    }
    #[test]
    fn checkpoint_resolves_code_by_id_and_rejects_version_drift() {
        let context = demo_context(); let kernel = graph();
        let mut checkpoint = kernel.start(&context, State::default(), "plan", 12).unwrap();
        kernel.step(&mut checkpoint, &context).unwrap();
        graph().run(&mut checkpoint.clone(), &context).unwrap();
        let mut incompatible = graph(); incompatible.graph_revision = "ops-review/v2".into();
        assert_eq!(incompatible.step(&mut checkpoint.clone(), &context), Err(KernelError::VersionMismatch));
        let mut incompatible_node = graph(); incompatible_node.nodes.get_mut(&NodeId::new("join")).unwrap().revision = "v2".into();
        assert_eq!(incompatible_node.step(&mut checkpoint, &context), Err(KernelError::VersionMismatch));
    }
    #[test]
    fn cancellation_and_scope_revocation_stop_before_dispatch() {
        let context = demo_context(); let kernel = graph();
        let mut checkpoint = kernel.start(&context, State::default(), "plan", 12).unwrap();
        let mut changed = context.clone(); changed.capability_epoch += 1;
        assert_eq!(kernel.step(&mut checkpoint, &changed), Err(KernelError::ScopeMismatch));
        context.cancelled.store(true, Ordering::Release);
        assert_eq!(kernel.step(&mut checkpoint, &context), Err(KernelError::Cancelled));
        assert_eq!(checkpoint.superstep, 0); assert_eq!(checkpoint.fuel_remaining, 12);
    }
    #[test]
    fn cycles_have_a_budget_and_a_step_bound() {
        let context = demo_context();
        let mut kernel = Kernel::new("loop/v1", 3, |_| false);
        kernel.register("loop", "v1", |_, _| Ok(Transition::to("iteration", &["loop"]))); kernel.edge("loop", "loop");
        let mut fuel_limited = kernel.start(&context, State::default(), "loop", 2).unwrap();
        assert_eq!(kernel.run(&mut fuel_limited, &context), Err(KernelError::BudgetExhausted));
        assert_eq!(fuel_limited.superstep, 2);
        let mut step_limited = kernel.start(&context, State::default(), "loop", 99).unwrap();
        assert_eq!(kernel.run(&mut step_limited, &context), Err(KernelError::StepLimitExceeded));
        assert_eq!(step_limited.superstep, 3);
    }
    #[test]
    fn failed_node_does_not_publish_partial_state_or_intents() {
        let context = demo_context(); let mut kernel = graph();
        kernel.register("operations", "v1", |_, _| Err(KernelError::NodeFailure("provider unavailable".into())));
        let mut checkpoint = kernel.start(&context, State::default(), "plan", 12).unwrap();
        kernel.step(&mut checkpoint, &context).unwrap(); let before = checkpoint.state.clone();
        assert!(matches!(kernel.step(&mut checkpoint, &context), Err(KernelError::NodeFailure(_))));
        assert_eq!(checkpoint.state, before); assert_eq!(checkpoint.superstep, 1); assert!(checkpoint.intents.is_empty());
        assert_eq!(checkpoint.fuel_remaining, 9); // failed attempts still consumed fuel
    }
    #[test]
    fn lost_ack_requires_reconciliation_and_never_blind_resend() {
        let context = demo_context(); let mut ledger = EffectLedger::default();
        let intent = EffectIntent { operation_id: "op:1".into(), payload: "draft".into(), capability: "workorder:draft".into() };
        ledger.prepare(intent.clone(), &context).unwrap(); ledger.mark_sent("op:1", &context).unwrap(); ledger.lost_ack("op:1").unwrap();
        ledger.prepare(intent, &context).unwrap(); // repeated prepare cannot reset Unknown
        assert_eq!(ledger.mark_sent("op:1", &context), Err(KernelError::PendingReconciliation));
        ledger.reconcile("op:1", ProviderAnswer::Indeterminate).unwrap();
        assert_eq!(ledger.mark_sent("op:1", &context), Err(KernelError::PendingReconciliation));
        ledger.reconcile("op:1", ProviderAnswer::Confirmed("receipt".into())).unwrap();
        assert_eq!(ledger.records["op:1"].send_attempts, 1);
        assert_eq!(ledger.records["op:1"].status, EffectStatus::Confirmed("receipt".into()));
    }
    #[test]
    fn same_operation_id_cannot_change_payload() {
        let context = demo_context(); let mut ledger = EffectLedger::default();
        let mut intent = EffectIntent { operation_id: "op:1".into(), payload: "draft".into(), capability: "workorder:draft".into() };
        ledger.prepare(intent.clone(), &context).unwrap(); intent.payload = "different draft".into();
        assert_eq!(ledger.prepare(intent, &context), Err(KernelError::IntentConflict("op:1".into())));
    }
    #[test]
    fn registered_function_can_capture_config_and_receive_fresh_context() {
        let context = demo_context(); let mut kernel = Kernel::new("capture/v1", 1, |_| false);
        let prefix = String::from("configuration + ");
        kernel.register("captured", "v1", move |_, context| {
            Ok(Transition::to(&format!("{}{}", prefix, context.principal), &[]))
        });
        let mut checkpoint = kernel.start(&context, State::default(), "captured", 1).unwrap();
        kernel.run(&mut checkpoint, &context).unwrap();
        assert!(checkpoint.state.facts.contains("configuration + engineer:demo"));
    }
    #[test]
    fn expired_deadline_and_undeclared_route_are_rejected() {
        let context = demo_context(); let mut kernel = graph();
        let mut checkpoint = kernel.start(&context, State::default(), "plan", 12).unwrap();
        let mut expired = context.clone(); expired.deadline = Instant::now();
        assert_eq!(kernel.step(&mut checkpoint, &expired), Err(KernelError::DeadlineExceeded));
        kernel.register("plan", "v1", |_, _| Ok(Transition::to("bad route", &["join"])));
        assert_eq!(kernel.step(&mut checkpoint, &context), Err(KernelError::IllegalEdge("plan".into(), "join".into())));
        assert!(checkpoint.state.facts.is_empty()); assert_eq!(checkpoint.superstep, 0);
    }
    #[test]
    fn missing_capability_cannot_publish_effect_intent() {
        let mut context = demo_context(); context.capabilities.clear(); let kernel = graph();
        let mut checkpoint = kernel.start(&context, State::default(), "plan", 12).unwrap();
        assert_eq!(kernel.run(&mut checkpoint, &context), Err(KernelError::Unauthorized("workorder:draft".into())));
        assert!(checkpoint.intents.is_empty()); assert!(!checkpoint.state.facts.contains("review complete"));
    }
    #[test]
    fn authoritative_nonexecution_proof_permits_a_new_attempt() {
        let context = demo_context(); let mut ledger = EffectLedger::default();
        let intent = EffectIntent { operation_id: "op:2".into(), payload: "draft".into(), capability: "workorder:draft".into() };
        ledger.prepare(intent, &context).unwrap(); ledger.mark_sent("op:2", &context).unwrap(); ledger.lost_ack("op:2").unwrap();
        ledger.reconcile("op:2", ProviderAnswer::DefinitelyAbsent).unwrap(); ledger.mark_sent("op:2", &context).unwrap();
        assert_eq!(ledger.records["op:2"].send_attempts, 2);
    }
}

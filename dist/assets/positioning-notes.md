# Positioning and Agent strategy mappings

Source review: October 2026. Product descriptions below are based on primary documentation. Their relationship to this architecture is our analysis, not a claim that those products cannot implement similar controls. No comparative benchmark or exhaustive feature audit is asserted.

## The position

This framework is an enterprise execution architecture with explicit ownership of request scope, state, workspaces, resources, tool dispatch, recovery, and presentation. A strategy chooses actions inside that contract; a harness supplies Agent capabilities; a backend executes and persists them; the application binds them to business authority and user experience.

The useful distinction is ownership. Strategy policy can change without changing a department's authority. The backend can change while keeping storage/tool/UI contracts. Accepted observations, physical bytes, source evidence, and external-effect receipts have independently defined lifetimes.

The inspected implementation supplies a LangGraph/Deep Agents route, department/browser boundaries, state/disk/read-only knowledge routing, registered tools, and SDK-driven UI. The included Rust kernel demonstrates selected execution semantics. Full Rust-service integration, bounded search controllers, replicated recovery, and authorized business writes are explicit implementation paths.

## Related projects

| Project or role | Documented center of gravity | Relationship to this architecture |
| --- | --- | --- |
| Dify | Application platform: agent/workflow authoring, knowledge, integrations, publishing, APIs, cloud/self-hosting. | Fits application delivery. Integrating an app requires deciding who owns scope, run state, and effects. |
| LangChain | Reusable model/tool interfaces, Agent construction, middleware, integrations; Agents use LangGraph. | Useful components within the current backend. Domain contracts define the authorized resource behind each call. |
| LangGraph | Low-level stateful orchestration with persistence, streaming, and interruption primitives. | One supported execution route. Product contracts can also be implemented by a custom Rust backend. |
| Codex | Agent product and open harness, with SDK/app-server surfaces for embedded applications. | Can be an embedded Agent or specialized worker. The surrounding service binds business context and authority. |
| Claude Code / Agent SDK | Coding Agent and programmable loop/tools/context/session/permission capabilities. | Can supply an Agent inside a host application or a bounded delegated worker. |
| Pi | Minimal extensible harness with extensions, skills, packages, RPC/SDK modes, and context/session controls. | Can supply a customizable harness behind the same host-service contracts. |
| Harness | Architectural role around a model rather than a single competitor. | Connects context, tools, working environment, sessions, and control hooks to the backend and application. |

None of Codex, Claude Code, or Pi is treated as restricted to a standalone terminal experience. Proposed integration options for them are not registered connections in the inspected application.

## A constructive mapping

Let context `C` contain trusted identity/scope bindings, the user query, and available resources. Let `S` contain accepted messages, plan/draft state, observations, and any controller-specific state.

```text
a_t     = policy(C, S_t)
o_t     = execute(a_t, current_authority, remaining_budget)
S_{t+1} = update(S_t, a_t, o_t)
```

`policy` can include model/evaluator calls and select an action, state update, delegation, review pause, or final response. A controller carries its own stop conditions. This notation describes application state and visible decisions, not exposed private reasoning.

The mapping has four steps:

1. Add the algorithm's required state to `S` with explicit identity, version, and retention.
2. Represent model, retrieval, tool, and evaluator calls through observable action adapters.
3. Implement the algorithm's selection, update, and stop rules as its policy/controller.
4. Enforce scope, capacity, checkpoints, and effect authorization at execution boundaries.

This establishes a place for the algorithm in the architecture. It does not automatically implement its evaluator or prove its quality. Substituting a backend should preserve the relevant state transitions, accepted observations, authority checks, and external-effect semantics.

## Strategy mapping

| Strategy | Defining mechanism | State/controller required | Implementation relationship |
| --- | --- | --- | --- |
| ReAct | Interleave reasoning, actions, and environment observations. | Action/observation history and next-action policy. | The current tool-calling loop supplies the interaction primitives. Exact paper prompting/evaluation is a separate choice. |
| Plan-and-Execute | A high-level planner supplies steps to a step executor; variants replan. | Plan, completion state, step selection, planner/executor and replanning rules. | Mutable todos/files are present; an explicit split controller can compose them. |
| Reflexion | Evaluate an attempt, retain verbal feedback memory, use it in a later trial. | Trial outcomes, evaluator, reflection writer, episodic memory selection. | Reflection messages/state are primitives; a cross-trial controller is an extension. |
| Tree of Thoughts | Generate and evaluate candidate reasoning states with selection/backtracking. | Candidate graph/frontier, scores, generation/evaluation/search policy. | A bounded candidate-state controller is an implementation path. |
| LATS | MCTS over reasoning/action trajectories with value evaluation, feedback, reflection. | Trajectory tree, visit/value statistics, selection/expansion/rollout/backup, cost limits. | An explicit controller/evaluator extension fits the same runtime contracts. |
| RAG / Agentic RAG | Ground output in retrieved material; an Agent can choose and refine retrieval. | Queries, source candidates, evidence references, retrieval/reading policy. | Source search/read/refinement primitives are implemented; the inspected index is lexical. |
| Multi-Agent | Delegate to separate contexts/roles and return results. | Child task inputs, results, provenance, context boundaries and merge rules. | General-purpose/custom subagents are present; cross-department handoff needs additional authorization. |
| Human-in-the-Loop | Pause at a decision boundary and continue from authorized feedback. | Proposal, reviewer/payload bindings, saved continuation, approve/reject/edit rules. | Review/resume and approved-effect adapters are a service extension. |

These patterns compose: a planned step can use ReAct and retrieval; a delegate can evaluate a search candidate; a selected business write can require review. The composition retains each algorithm's own invariants. A retry is not tree search, a todo is not a full planner/executor, and a reflection tool is not a complete Reflexion implementation.

## Where the architecture earns its place

A ready platform or harness is often sufficient for one application. Explicit operating contracts become valuable when many departments share private services, storage lifetimes differ, work must resume after failure, external writes have uncertain outcomes, or backend/deployment choices must remain changeable.

The architectural advantages are strategy mobility, backend mobility, and precise operational semantics. Task quality, throughput, failure recovery, and integration costs should be measured against the intended workload before claiming empirical superiority.

## Primary sources

- [Dify documentation](https://docs.dify.ai/en/home)
- [LangChain overview](https://docs.langchain.com/oss/python/langchain/overview)
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [Codex as an open platform](https://developers.openai.com/blog/codex-as-a-platform)
- [Claude Code](https://code.claude.com/docs/en/overview), [Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview)
- [Pi](https://pi.dev/)
- [Deep Agents harness](https://docs.langchain.com/oss/python/deepagents/overview)
- [ReAct paper](https://arxiv.org/abs/2210.03629)
- [Plan-and-Execute primary description](https://www.langchain.com/blog/plan-and-execute-agents)
- [Reflexion paper](https://arxiv.org/abs/2303.11366)
- [Tree of Thoughts paper](https://arxiv.org/abs/2305.10601)
- [LATS paper](https://proceedings.mlr.press/v235/zhou24r.html)
- [RAG paper](https://arxiv.org/abs/2005.11401)
- [Human interruption contract](https://docs.langchain.com/oss/python/langgraph/interrupts)

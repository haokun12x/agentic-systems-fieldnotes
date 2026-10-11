(() => {
  'use strict';
  const root = document.getElementById('backend-routes');
  if (!root) return;
  const el = name => document.getElementById(`backend-${name}`);
  const routes = {
    langgraph: {
      title: 'Use the framework as the execution backend.', badge: 'CURRENT APPLICATION ROUTE',
      description: 'Deep Agents provides the harness; LangGraph executes model and tool turns with thread state. The checked application uses this route for department-scoped tools, workspaces, and streamed UI updates.',
      nodes: [['ADAPTER', 'LangGraph API + SDK', 'Thread/run input · stream output'], ['AGENT RUNTIME', 'Deep Agents / LangGraph', 'Model decision → tool result → model'], ['RESOURCES', 'Backends + tool services', 'State files · disk · knowledge · APIs']]
    },
    rust: {
      title: 'Implement the Agent contracts in a native runtime.', badge: 'CUSTOM RUNTIME ROUTE · KERNEL FOUNDATION',
      description: 'A Rust backend can receive the same scoped request, call the same model and tool services, maintain plans and workspaces, and stream the same user-facing results. Its scheduler and recovery policies can be designed directly for the workload.',
      nodes: [['ADAPTER', 'Compatible or custom API', 'Thread/run input · versioned events'], ['AGENT RUNTIME', 'Rust action interpreter', 'Model decision → typed dispatch → observation'], ['RESOURCES', 'Scoped stores + adapters', 'State files · disk · knowledge · APIs']]
    }
  };
  const scenarios = {
    adaptive: {
      label: 'adaptive request handling', title: 'Context drives the next decision.',
      requirement: 'Combine the authorized department, current query, conversation, tools, and available resources. Revise actions when observations change.',
      langgraph: ['Build the scoped model context and registered tool schemas.', 'Execute model tool calls and append their observations.', 'Re-enter the model, update optional todos/files, or return an answer.'],
      rust: ['Assemble the same context through model and resource adapters.', 'Decode a model action into a typed tool call, optional plan update, delegation, or answer.', 'Persist the observation and re-enter the model; a failed or weak result can change its next action.'],
      evidence: {langgraph: 'Source evidence: the existing create_deep_agent construction and SDK connection implement this Agent loop.', rust: 'Implementation path: extend the included typed execution kernel with model clients, tool-call decoding, plan/delegation state, and a streaming adapter.'}
    },
    fanout: {
      label: 'many tools, bounded capacity', title: 'Useful parallel work stays within capacity.',
      requirement: 'An Agent may request many independent reads across documents or services. Bound concurrent calls, per-department resource use, and waiting time while returning observations to the decision loop.',
      langgraph: ['Represent independent tool work and merge observations into graph state.', 'Add application-level admission limits, bounded tool concurrency, and service deadlines.', 'Feed successful results and timeout/error observations back to the model for another choice.'],
      rust: ['Use asynchronous tasks plus bounded channels and semaphores for tenant admission and tool concurrency.', 'Apply explicit merge/conflict rules to concurrent results; isolate blocking converters in bounded workers.', 'Record partial results and deadline outcomes so the model can refine, continue, or explain the limit.'],
      evidence: {langgraph: 'Framework route: application policies supply these limits. The checked application does not contain a central fair queue or global capacity scheduler.', rust: 'Foundation + extension: the kernel demonstrates shared snapshots and deterministic reducers. Async workers and bounded admission build on those semantics; Tokio supplies task/channel primitives.'}
    },
    recovery: {
      label: 'worker loss and long-running work', title: 'Resume the logical task on a healthy worker.',
      requirement: 'A long-running request must retain accepted observations and pending work, recover after a worker dies, and revalidate authority before continuing.',
      langgraph: ['Use checkpoint and interrupt primitives with an appropriate durable store.', 'Record pending work, retry policy, versions, and authorization bindings at safe boundaries.', 'Reconnect the UI and resume supported work through a supervised backend deployment.'],
      rust: ['Commit state, pending actions, accepted observations, and effect intents with code/schema bindings.', 'Use durable storage, worker leases, and fencing to prevent a stale worker from committing.', 'Reacquire resource handles, recheck scope and deadlines, then resume from the saved continuation.'],
      evidence: {langgraph: 'Current deployment: local development checkpoint files establish a narrower persistence contract. Replicated recovery requires a production storage and worker design.', rust: 'Foundation + extension: the kernel validates scope/code-bound checkpoints and logical budgets. Durable commits, leases, and fencing are the full-service implementation path.'}
    },
    effects: {
      label: 'external action, lost response', title: 'An uncertain outcome has its own state.',
      requirement: 'A provider may complete an approved business action even when its response is lost. Preserve that uncertainty and reconcile the result before another send.',
      langgraph: ['Keep the model’s action proposal separate from an authorized effect adapter.', 'Persist a stable operation key and an explicit uncertain state when the receipt is missing.', 'Query authoritative provider status or use its idempotency contract before choosing another attempt.'],
      rust: ['Interpret the model proposal as an effect intent bound to approved scope and payload.', 'Track Prepared → Sent → Unknown → Confirmed with a durable ledger and provider operation key.', 'Fence dispatch and reconcile Unknown before a resend; return the confirmed receipt as an Agent observation.'],
      evidence: {langgraph: 'Application extension: an effect ledger and idempotent provider adapter can be added around a LangGraph Agent. The checked registry does not implement a business-write approval path.', rust: 'Executable foundation: the kernel models uncertainty, payload binding, and refusing a blind resend. A production adapter adds durable transactions and real provider reconciliation.'}
    }
  };
  let route = 'langgraph';
  function render() {
    const current = routes[route], scenario = scenarios[el('scenario').value];
    root.querySelectorAll('[data-backend-route]').forEach(button => {
      const selected = button.dataset.backendRoute === route;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    el('panel').setAttribute('aria-labelledby', `backend-tab-${route}`);
    el('stage').textContent = current.badge;
    el('stage').classList.toggle('is-rust', route === 'rust');
    el('route-title').textContent = current.title;
    el('route-description').textContent = current.description;
    el('diagram').replaceChildren();
    for (const [index, [label, title, detail]] of current.nodes.entries()) {
      if (index) { const arrow = document.createElement('b'); arrow.textContent = '⇄'; arrow.setAttribute('aria-hidden', 'true'); el('diagram').append(arrow); }
      const node = document.createElement('div');
      for (const [tag, text] of [['span', label], ['strong', title], ['small', detail]]) { const child = document.createElement(tag); child.textContent = text; node.append(child); }
      el('diagram').append(node);
    }
    el('requirement-title').textContent = scenario.title;
    el('requirement').textContent = scenario.requirement;
    el('mechanisms').replaceChildren(...scenario[route].map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    el('evidence').textContent = scenario.evidence[route];
    el('status').textContent = `${route === 'rust' ? 'Rust' : 'LangGraph'} route selected: ${scenario.label}. The shared Agent requirement is preserved.`;
  }
  root.querySelectorAll('[data-backend-route]').forEach(button => {
    button.addEventListener('click', () => { route = button.dataset.backendRoute; render(); });
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      route = event.key === 'Home' ? 'langgraph' : event.key === 'End' ? 'rust' : route === 'rust' ? 'langgraph' : 'rust';
      render(); el(`tab-${route}`).focus();
    });
  });
  el('scenario').addEventListener('change', render);
  render();
})();

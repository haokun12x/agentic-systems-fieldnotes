(() => {
  'use strict';
  const root = document.getElementById('journey-lab');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const stringify = value => JSON.stringify(value, null, 2);
  const steps = [
    { id: 'request', tab: 'Request', nodes: ['request'], wire: '', owner: 'user', kicker: 'CLIENT INPUT', title: 'Intent enters. Authority does not.', explanation: 'The browser sends a task and references to uploaded content. The request ID makes retries identifiable; the selected workspace expresses intent, not proof of access.', work: 'The gateway validates the envelope and resolves the authenticated session on the server. It derives the principal and allowed scope before invoking any connector.', boundary: 'Browser → API gateway', invariant: 'User-supplied IDs never grant access.', event: 'client.requested', packetKind: 'NORMALIZED INPUT', packet: { request_id: 'req_042', validation: 'pending', principal: null, scope: null }, note: 'The browser supplies intent. The server derives identity; neither a workspace name nor a model output is a credential.', uiStatus: 'Ready to submit', ui: 'Your request and voice note appear immediately. A local message is not evidence that the server accepted the work.', tag: 'DRAFT' },
    { id: 'auth', tab: 'Authorize', nodes: ['auth'], wire: 'auth', owner: 'runtime', kicker: 'POLICY BOUNDARY', title: 'Resolve who may read what.', explanation: 'The gateway validates the session, resolves workspace membership, and evaluates resource policies. This review can read approved procurement data; it cannot create an order.', work: 'The server attaches a short-lived, narrowed scope. Database row policies, document ACLs, and the audio object policy are enforced again at their respective connectors. Trace context correlates work; it grants no authority.', boundary: 'Gateway → policy service', invariant: 'Deny before dispatch. Recheck at the resource.', event: 'request.authorized', packetKind: 'SERVER-DERIVED SCOPE', packet: { principal: 'user_17', tenant: 'tenant_demo', scope: ['budget:read', 'policy:read', 'voice:transcribe'], policy_version: 12 }, note: 'The scope comes from authenticated server policy. User content and retrieved documents cannot expand it.', uiStatus: 'Access verified', ui: 'The review has access to the selected workspace. Purchasing remains outside this request’s scope.', tag: 'SCOPED' },
    { id: 'plan', tab: 'Plan', nodes: ['plan'], wire: 'plan', owner: 'runtime', kicker: 'DURABLE COORDINATION', title: 'Make the work explicit.', explanation: 'The runtime creates run_042 and a bounded graph: read the budget, retrieve policy and proposal, and transcribe the voice note. These independent reads can proceed together.', work: 'Persist the plan and task IDs before dispatch. Set deadlines, retry limits, a token budget, and a cancellation handle. Record dependencies so inference starts only after the required evidence is available.', boundary: 'Coordinator → task queue', invariant: 'Every task has an owner, deadline, and state.', event: 'run.planned', packetKind: 'RUN STATE', packet: { run_id: 'run_042', plan_version: 1, parallel: ['budget', 'documents', 'asr'], join: 'all_required', step_budget: 12 }, note: 'Planning selects registered tools and dependencies. The runtime, not the model response or browser, schedules them.', uiStatus: 'Preparing the review', ui: 'Three evidence tasks are queued. The UI can close or reconnect without becoming responsible for their execution.', tag: 'PLANNED' },
    { id: 'gather', tab: 'Gather', nodes: ['database', 'documents', 'voice'], wire: 'gather', owner: 'service', kicker: 'PARALLEL EVIDENCE', title: 'Different services. One typed boundary.', explanation: 'A database connector returns permitted budget rows. Retrieval returns document excerpts with source versions. ASR returns text with audio timestamps; all three carry provenance.', work: 'Use parameterized, read-only SQL; apply document ACL filters before returning chunks; authorize the audio reference. Adapters normalize each response into an evidence record. Treat retrieved instructions as untrusted data.', boundary: 'Connectors → evidence records', invariant: 'Evidence keeps its source, version, and scope.', event: 'evidence.collected', packetKind: 'CONNECTOR RESULT', packet: { task: 'budget', result: { available_usd: 125000 }, evidence: { id: 'ev_budget_812', source: 'ledger:row_812', version: 7 }, read_only: true }, note: 'Tools return domain data, not UI markup. Audio, rows, and document excerpts converge into typed evidence.', uiStatus: 'Evidence collected', ui: 'Budget, policy, and the voice transcript are available. The answer is still being prepared; these are source records, not a recommendation.', tag: '3 SOURCES', evidence: true },
    { id: 'reason', tab: 'Reason', nodes: ['reason'], wire: 'reason', owner: 'runtime', kicker: 'BOUNDED INFERENCE', title: 'Compose a draft from evidence.', explanation: 'The model gateway receives the task, selected evidence, and a structured output contract. Context assembly applies token limits and keeps each claim linked to a source ID.', work: 'Route to an eligible model deployment, reserve generation capacity, and enforce time and token budgets. Only authorized context reaches the model; the model returns a proposed brief with citations, not an executable purchase.', boundary: 'Runtime → model gateway', invariant: 'A generated claim is a proposal until checked.', event: 'draft.generated', packetKind: 'MODEL OUTPUT', packet: { artifact_type: 'supplier_review', recommendation: 'request_legal_review', budget_status: 'within_budget', evidence_ids: ['ev_budget_812', 'ev_policy_42', 'ev_voice_18'] }, note: 'A trace may record model/version and token counts. This exhibit shows structured outputs, not private model reasoning.', uiStatus: 'Drafting with evidence', ui: 'The runtime is assembling the review. Any streamed text is provisional until the artifact passes validation.', tag: 'DRAFTING', evidence: true },
    { id: 'validate', tab: 'Validate', nodes: ['validate'], wire: 'validate', owner: 'runtime', kicker: 'VALIDATION GATE', title: 'Check the claims and the action.', explanation: 'Validate the output schema, resolve each citation to an authorized source, and verify numeric claims against the budget result. The recommendation still requires a human decision.', work: 'Run deterministic schema and arithmetic checks. Verify evidence coverage and current access. Missing or contradictory evidence routes to a bounded repair or human review. Citation presence alone does not prove that a claim is true.', boundary: 'Draft → checked artifact', invariant: 'No unsupported claim becomes a silent success.', event: 'artifact.validated', packetKind: 'VALIDATION RECORD', packet: { schema: 'supplier_review.v1', citations_resolved: 3, budget_check: 'passed', purchase_executed: false, next_action: 'human_legal_review' }, note: 'Mechanical checks have limits. Semantic or legal judgments remain reviewable; draft approval is not purchasing authority.', uiStatus: 'Checking the brief', ui: 'The draft is being checked against its sources. The runtime confirms the budget calculation and flags the contract for legal review.', tag: 'CHECKING', evidence: true },
    { id: 'persist', tab: 'Persist', nodes: ['persist'], wire: 'persist', owner: 'runtime', kicker: 'DURABLE COMMIT', title: 'Record the result before announcing it.', explanation: 'Commit the validated artifact, checkpoint version, and an outbox event in one transaction in this design. A separate publisher delivers the committed event.', work: 'A restart resumes from durable state. Completed read results remain available. Outbox delivery can repeat, so consumers deduplicate event IDs. External writes would additionally require an idempotency key and reconciliation with the target system.', boundary: 'Runtime → durable state store', invariant: 'No completion event without a committed result.', event: 'checkpoint.committed', packetKind: 'COMMITTED STATE', packet: { run_id: 'run_042', checkpoint: 4, artifact: 'brief_042:v1', outbox_event: 'evt_008', status: 'completed' }, note: 'This illustrates a transactional outbox design. It does not claim a distributed exactly-once guarantee.', uiStatus: 'Saving the brief', ui: 'The result has been committed. The browser is waiting for the completion event to update the visible artifact.', tag: 'SAVED', evidence: true },
    { id: 'stream', tab: 'Stream', nodes: ['stream'], wire: 'stream', owner: 'runtime', kicker: 'PRESENTATION CONTRACT', title: 'Send events, not backend internals.', explanation: 'The API emits a sequenced, versioned event that names the artifact and its visible status. The UI needs neither the task graph nor database credentials to render it.', work: 'An event publisher projects permitted fields from committed state. For SSE, the id field supports reconnect with Last-Event-ID; the server must implement retention and replay. A trace ID connects logs and spans, independently of the UI sequence.', boundary: 'Event API → browser', invariant: 'Replay and deduplication are application contracts.', event: 'artifact.ready', packetKind: 'SSE EVENT', packet: 'id: evt_008\nevent: artifact.ready\ndata: {"schema":1,"seq":8,"run_id":"run_042","artifact_ref":"brief_042:v1"}\n\n', note: 'SSE is a server-to-client stream. New commands, approvals, and cancellation use a separate authenticated API.', uiStatus: 'Receiving the result', ui: 'The browser has received artifact.ready. It fetches the authorized artifact representation and applies the event to its local view.', tag: 'SYNCING', evidence: true },
    { id: 'present', tab: 'Present', nodes: ['present'], wire: 'present', owner: 'user', kicker: 'CLIENT PROJECTION', title: 'Turn state into a useful interface.', explanation: 'A client reducer applies the event once and renders the checked brief, citations, status, and next action. A reconnecting client can reconstruct the same view from a snapshot plus newer events.', work: 'The browser keys events by run and sequence, ignores duplicates, and detects gaps. It renders structured fields safely, displays authorized evidence links, and keeps a human review action separate from execution authority.', boundary: 'Event + artifact → UI state', invariant: 'UI refreshes must not repeat business effects.', event: 'ui.projected', packetKind: 'CLIENT VIEW MODEL', packet: { run_id: 'run_042', applied_seq: 8, component: 'SupplierReview', artifact: 'brief_042:v1', status: 'ready_for_review' }, note: 'This is client-owned presentation state derived from runtime-owned facts. Styling and layouts can change independently.', uiStatus: 'Ready for legal review', ui: 'Atlas fits the available budget. The proposal needs legal review of its renewal clause before any approval. Sources remain attached to the brief.', tag: 'COMPLETE', evidence: true, artifact: true }
  ];
  const timeout = { ...steps[3], id: 'timeout', tab: 'Timeout', nodes: ['documents'], completedNodes: ['database', 'voice'], wire: 'gather', owner: 'runtime', kicker: 'PARTIAL FAILURE', title: 'One timeout does not erase the run.', explanation: 'The database and ASR tasks completed, but document retrieval exceeded its deadline. The runtime records the attempt as failed and keeps successful results in durable task state.', work: 'Classify the failure as transient. Do not fabricate missing policy evidence or rerun completed siblings. A timer schedules a bounded retry with backoff; the join remains blocked until the required evidence is available.', boundary: 'Document task → retry policy', invariant: 'A missing required source cannot be ignored.', event: 'tool.timed_out', packetKind: 'TASK FAILURE', packet: { task: 'documents', attempt: 1, status: 'deadline_exceeded', retained: ['budget', 'asr'], retry_in_ms: 800 }, note: 'The 800 ms delay is illustrative. Real backoff includes jitter, deadline limits, and an explicit terminal-failure path.', uiStatus: 'Retrying one evidence source', ui: 'The budget and voice note are ready. Policy retrieval timed out; the runtime is retrying that read before completing the review.', tag: 'RETRY', evidence: false, error: true };
  const recover = { ...steps[3], id: 'recover', tab: 'Recover', nodes: ['documents'], wire: 'recover', owner: 'runtime', kicker: 'BOUNDED RECOVERY', title: 'Resume only the missing work.', explanation: 'The second document attempt succeeds. The runtime combines it with the already recorded database and ASR results, then opens the join barrier for inference.', work: 'Recheck authorization and source versions before retrying. Record the attempt and returned evidence. If this attempt also failed beyond the retry budget, the run would surface a recoverable failure or ask for human input.', boundary: 'Task checkpoint → evidence join', invariant: 'Successful siblings are reused, not replayed blindly.', event: 'tool.retry_succeeded', packetKind: 'RECOVERY RECORD', packet: { task: 'documents', attempt: 2, evidence: 'ev_policy_42', reused: ['budget', 'asr'], join: 'ready' }, note: 'Read retries are simpler than write retries. A timed-out external write needs an idempotency key and outcome reconciliation.', uiStatus: 'Evidence recovered', ui: 'Policy retrieval succeeded. The review continues using the completed budget and voice tasks.', tag: 'RECOVERED', evidence: true };
  const denied = { ...steps[1], id: 'denied', tab: 'Deny', nodes: ['auth'], wire: 'auth', kicker: 'POLICY DENIAL', title: 'Stop at the authority boundary.', explanation: 'This caller lacks membership in the procurement workspace. The gateway rejects the request before a plan, connector task, or model invocation can be created.', work: 'Record an audit decision with a safe reason code. Return a denied state without document titles, budget amounts, or other protected metadata. An access request is a separate administrative workflow.', boundary: 'Gateway → denied result', invariant: 'No authorized scope means no tool execution.', event: 'request.denied', packetKind: 'SAFE ERROR RESPONSE', packet: { request_id: 'req_042', status: 403, code: 'workspace_access_denied', retryable: false, run_id: null }, note: 'Permission failures are not transient tool errors. Repeated retries cannot manufacture authority.', uiStatus: 'Workspace access required', ui: 'This request cannot access procurement data. No database, document, audio, or model task has started.', tag: 'DENIED', evidence: false, artifact: false, error: true };
  const deniedEvent = { ...steps[7], id: 'deniedEvent', tab: 'Return', nodes: ['stream'], wire: 'deny', kicker: 'SAFE RESPONSE', title: 'Explain the stop without leaking data.', explanation: 'The gateway returns a structured 403 response. Because no run was accepted, no run-event stream is opened; the browser maps the safe error code into an actionable message.', work: 'Correlate the request with the audit decision while keeping protected resource details out of the response. The client can show how to request access through the organization’s normal process.', boundary: 'Gateway → client error handler', invariant: 'A denial reveals no protected evidence.', event: 'error.returned', packetKind: 'HTTP 403 / JSON', packet: { request_id: 'req_042', code: 'workspace_access_denied', message: 'Workspace access required', run_created: false }, note: 'This rejection uses the command response, not the accepted-run SSE stream. The same UI contract can represent both.', uiStatus: 'Workspace access required', ui: 'Access was denied before execution. Ask a workspace owner for the required role, then submit a new request.', tag: 'DENIED', evidence: false, artifact: false, error: true };
  const deniedUI = { ...steps[8], id: 'deniedUI', tab: 'Present', nodes: ['present'], wire: 'present', title: 'A clear failure is also a result.', explanation: 'The browser renders a stable error state associated with the original request. It offers access guidance and never shows a success artifact or partial protected content.', work: 'The client interprets the stable error code, preserves the user’s draft, and lets the user try again after access changes. It cannot override the policy decision with a local setting.', boundary: 'Safe error → UI state', invariant: 'Presentation never overrides authorization.', event: 'ui.denied', packetKind: 'CLIENT ERROR STATE', packet: { request_id: 'req_042', component: 'AccessRequired', draft_preserved: true, artifacts: [] }, note: 'The UI can explain and recover from an error without possessing the authority to bypass it.', uiStatus: 'Access required · draft preserved', ui: 'Your draft is preserved. Procurement access is required before this review can run. No protected content has been retrieved.', tag: 'DENIED', evidence: false, artifact: false, error: true };
  let scenario = 'normal';
  let sequence = steps;
  let position = 0;
  let timer = null;
  const play = $('journey-play');
  const nodes = [...root.querySelectorAll('[data-journey-node]')];
  const wires = [...root.querySelectorAll('[data-journey-wire]')];
  const dynamic = { kicker: $('journey-inspector-kicker'), title: $('journey-inspector-title'), explanation: $('journey-explanation'), work: $('journey-runtime-work'), boundary: $('journey-boundary'), invariant: $('journey-invariant'), note: $('journey-payload-note'), uiStatus: $('journey-ui-status'), ui: $('journey-ui-body'), tag: $('journey-ui-indicator'), packetKind: $('journey-payload-kind') };
  const number = index => String(index + 1).padStart(2, '0');
  function pause() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    play.textContent = position === sequence.length - 1 ? '↺ Replay' : '▶ Play trace';
    play.setAttribute('aria-label', position === sequence.length - 1 ? 'Replay request lifecycle' : 'Play request lifecycle');
  }
  function renderTabs() {
    $('journey-steps').replaceChildren(...sequence.map((step, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.journeyIndex = index;
      const label = document.createElement('span');
      label.textContent = number(index);
      button.append(label, document.createTextNode(step.tab));
      return button;
    }));
  }
  function render() {
    const current = sequence[position];
    const streamNode = root.querySelector('[data-journey-node="stream"]');
    streamNode.querySelector('strong').textContent = scenario === 'denied' ? 'Command response' : 'Event stream';
    streamNode.querySelector('small').textContent = scenario === 'denied' ? 'HTTP 403 / JSON' : 'Versioned events';
    for (const [key, element] of Object.entries(dynamic)) element.textContent = current[key];
    dynamic.kicker.textContent = `${number(position)} / ${current.kicker}`;
    $('journey-owner').textContent = current.owner.toUpperCase();
    $('journey-owner').dataset.owner = current.owner;
    $('journey-position').textContent = `Step ${number(position)} / ${String(sequence.length).padStart(2, '0')}`;
    $('journey-payload-owner').textContent = current.packetKind.startsWith('CLIENT') ? 'CLIENT-DERIVED STATE' : 'RUNTIME-OWNED DATA';
    $('journey-payload').textContent = typeof current.packet === 'string' ? current.packet : stringify(current.packet);
    $('journey-evidence').hidden = !current.evidence;
    $('journey-artifact').hidden = !current.artifact;
    $('journey-next').disabled = position === sequence.length - 1;
    const completedNodes = new Set([...sequence.slice(0, position).flatMap(step => [...step.nodes, ...(step.completedNodes || [])]), ...(current.completedNodes || [])]);
    const availableNodes = new Set(sequence.flatMap(step => [...step.nodes, ...(step.completedNodes || [])]));
    const completedWires = new Set(sequence.slice(0, position).map(step => step.wire));
    nodes.forEach(node => {
      const name = node.dataset.journeyNode;
      const active = current.nodes.includes(name);
      node.classList.toggle('is-current', active);
      node.classList.toggle('is-complete', !active && completedNodes.has(name));
      node.classList.toggle('is-error', Boolean(active && current.error));
      node.classList.toggle('is-unavailable', !availableNodes.has(name));
      node.disabled = !availableNodes.has(name);
      node.setAttribute('aria-pressed', String(active));
    });
    wires.forEach(wire => {
      wire.classList.toggle('is-current', wire.dataset.journeyWire === current.wire);
      wire.classList.toggle('is-complete', wire.dataset.journeyWire !== current.wire && completedWires.has(wire.dataset.journeyWire));
    });
    root.querySelectorAll('[data-journey-index]').forEach(button => {
      const index = Number(button.dataset.journeyIndex);
      button.classList.toggle('is-current', index === position);
      button.classList.toggle('is-complete', index < position);
      button.setAttribute('aria-pressed', String(index === position));
    });
    $('journey-event-trail').replaceChildren(...sequence.slice(0, position + 1).map((step, index) => {
      const item = document.createElement('li');
      const seq = document.createElement('span');
      seq.textContent = number(index);
      item.append(seq, document.createTextNode(step.event));
      return item;
    }));
    $('journey-event-trail').scrollLeft = $('journey-event-trail').scrollWidth;
    if (position === sequence.length - 1) pause();
    else if (timer === null) pause();
  }
  function moveTo(index) { pause(); position = index; render(); }
  $('journey-next').addEventListener('click', () => moveTo(Math.min(position + 1, sequence.length - 1)));
  $('journey-reset').addEventListener('click', () => moveTo(0));
  $('journey-steps').addEventListener('click', event => {
    const button = event.target.closest('[data-journey-index]');
    if (button) moveTo(Number(button.dataset.journeyIndex));
  });
  nodes.forEach(node => node.addEventListener('click', () => {
    const index = sequence.findIndex(step => [...step.nodes, ...(step.completedNodes || [])].includes(node.dataset.journeyNode));
    if (index >= 0) moveTo(index);
  }));
  $('journey-scenario').addEventListener('change', event => {
    pause(); scenario = event.target.value;
    sequence = scenario === 'timeout' ? [...steps.slice(0, 3), timeout, recover, ...steps.slice(4)] : scenario === 'denied' ? [steps[0], denied, deniedEvent, deniedUI] : steps;
    position = 0;
    renderTabs(); render();
  });
  play.addEventListener('click', () => {
    if (timer !== null) { pause(); return; }
    if (position === sequence.length - 1) { position = 0; render(); }
    play.textContent = 'Ⅱ Pause';
    play.setAttribute('aria-label', 'Pause request lifecycle');
    timer = window.setInterval(() => { position = Math.min(position + 1, sequence.length - 1); render(); }, 3500);
  });
  $('journey-download').addEventListener('click', () => {
    const content = {
      schema: 'fieldnotes.educational-trace.v1', synthetic: true, scenario,
      request: { request_id: 'req_042', workspace_id: 'procurement', intent: 'prepare_supplier_review', attachments: ['upload:voice_07'], mode: 'draft_only' },
      viewed_through_step: position + 1,
      events: sequence.slice(0, position + 1).map((step, index) => ({ sequence: index + 1, name: step.event, owner: step.owner, boundary: step.boundary, invariant: step.invariant, payload: step.packet })),
      note: 'Educational local simulation. Event-trail indices describe the exhibit; wire protocol sequence numbers describe the hypothetical server stream. No external requests or business effects occurred.'
    };
    const url = URL.createObjectURL(new Blob([stringify(content)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = `agentic-request-${scenario}-trace.json`;
    document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.JourneyLab = Object.freeze({ getState: () => Object.freeze({ scenario, position, total: sequence.length, step: sequence[position].id, playing: timer !== null, events: Object.freeze(sequence.slice(0, position + 1).map(step => step.event)) }) });
  renderTabs(); render();
})();

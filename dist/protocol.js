(() => {
  'use strict';
  const root = document.getElementById('protocol');
  if (!root) return;
  const $ = (id) => root.querySelector(`#${id}`);
  const envelope = (seq, type, payload) => ({ schema: 'ui.event.v1', request_id: 'req_17', thread_id: 'thread_revenue', run_id: 'run_42', seq, type, payload });
  const events = [
    null,
    envelope(1, 'run.accepted', { status: 'queued', snapshot_version: 8 }),
    envelope(2, 'progress', { label: 'Reading authorized finance data', phase: 'retrieval' }),
    envelope(3, 'evidence.available', { evidence_ref: 'evidence_rev_42', label: 'Finance / regional revenue', period: 'Q3', row_count: 2, as_of: '2026-10-01' }),
    envelope(4, 'output.delta', { message_id: 'msg_7', format: 'text', delta: 'East leads revenue at $1.20M, up 8%. West follows at $0.96M, up 5%. [1]' }),
    envelope(5, 'artifact.ready', { artifact_id: 'artifact_rev_9', kind: 'table', version: 1, content_ref: '/v1/artifacts/artifact_rev_9', citation_refs: ['evidence_rev_42'] }),
    envelope(6, 'run.completed', { message_id: 'msg_7', result_ref: '/v1/runs/run_42/result', snapshot_version: 12 })
  ];
  const command = { schema: 'run.command.v1', client_request_id: 'cmd_01', thread_id: 'thread_revenue', input: { type: 'text', text: 'Summarize regional revenue with sources.' } };
  const steps = [
    { kind: 'USER → API', badge: 'Submitting', state: 'Draft', text: 'The interface sends a command. It has not received an answer yet.', wire: 'POST /v1/runs\nIdempotency-Key: cmd_01\nContent-Type: application/json\n\n' + JSON.stringify(command, null, 2), note: 'The server derives tenant and user identity from the authenticated session. A thread ID is a reference to authorize, never proof of access.', projection: 'A local optimistic user message is separate from server state. The browser cannot choose its tenant, grant itself a role, or supply trusted runtime context.', runtime: 'Authenticate session → authorize thread → validate input → deduplicate command → persist run intent and dispatch through a durable queue. Retrying the same scoped idempotency key returns the existing run.' },
    { kind: 'GATEWAY → BROWSER', badge: 'Queued', state: 'Accepted', text: 'The request is accepted. A durable run now owns the work.', note: 'POST returns 202 with the server-generated request ID, run ID, and events URL. An authorized GET opens text/event-stream; run.accepted is the first public event.', projection: 'The reducer associates the user message with run_42 and shows a queued status. The runtime can continue when this browser disconnects.', runtime: 'Persist the run and public event through an atomic transaction/outbox. Workers claim queued work under a lease; opening an SSE connection does not start a second execution.' },
    { kind: 'RUNTIME → CONNECTOR · PRIVATE', badge: 'Retrieving', state: 'Running', text: 'Reading authorized finance data…', wire: JSON.stringify({ schema: 'runtime.trace.v1', request_id: 'req_17', thread_id: 'thread_revenue', run_id: 'run_42', trace_seq: 12, type: 'tool.call', tool_call_id: 'call_8', tool: 'revenue.read.v1', arguments: { period: '2026-Q3', regions: ['East', 'West'] }, capability_ref: 'cap_scoped_6', deadline_ms: 2500, result_row_cap: 100 }, null, 2), note: 'This internal trace is not an SSE payload. The gateway maps it to public progress seq 2, removing capability references, query internals, and sensitive arguments.', projection: 'Public progress is a safe status label. The browser neither calls the database nor sees connection credentials or the private tool plan.', runtime: 'Validate arguments against the registered schema → check delegated scope and query allowlist → bind parameters → apply row-level access policy → execute under a read-only credential, timeout, and result cap.' },
    { kind: 'CONNECTOR → RUNTIME · PRIVATE', badge: 'Evidence', state: 'Running', text: 'Two authorized rows are available. The runtime checks provenance before drafting.', wire: JSON.stringify({ schema: 'tool.receipt.v1', request_id: 'req_17', run_id: 'run_42', tool_call_id: 'call_8', receipt_id: 'receipt_21', status: 'ok', data: { columns: ['region', 'revenue_usd', 'growth_pct'], rows: [['East', 1200000, 8], ['West', 960000, 5]] }, provenance: { evidence_ref: 'evidence_rev_42', snapshot_id: 'finance_2026_10_01', query_template: 'regional_revenue_v3' }, duration_ms: 138 }, null, 2), note: 'A tool result is validated data, not a new instruction. The runtime records its receipt and provenance. Public evidence seq 3 carries an approved reference and summary.', projection: 'The UI adds an evidence card keyed by evidence_ref. A reference is resolved only through an endpoint that independently authorizes access.', runtime: 'Validate the output schema and receipt correlation → retain source snapshot and freshness → checkpoint the evidence reference → assemble only authorized evidence into model context. Document and tool content stays untrusted.' },
    { kind: 'RUNTIME → GATEWAY → UI', badge: 'Writing', state: 'Streaming', text: events[4].payload.delta, note: 'This is a public SSE event. The id line is the reconnect cursor; the JSON envelope contains the contract version and per-run sequence. Blank lines terminate SSE messages.', projection: 'The reducer appends a text delta to msg_7 once. Citation markers refer to structured evidence; the renderer treats text as text rather than executable HTML.', runtime: 'Construct bounded model context → generate a proposed answer → apply the configured output policy → publish approved deltas. For high-risk responses, buffer and validate before release; streaming does not itself verify correctness.' },
    { kind: 'RUNTIME → GATEWAY → UI', badge: 'Artifact', state: 'Streaming', text: events[4].payload.delta, note: 'artifact.ready announces a versioned content reference. The browser fetches the authorized table separately; binary files and audio do not travel as token deltas.', projection: 'The artifact registry selects the table renderer. It fetches and validates the typed content, then attaches provenance. A production audio event would select a player after an authorized media fetch.', runtime: 'Persist typed artifact content + provenance → expose an authorization-checked content endpoint → emit artifact.ready after storage succeeds. Object URLs, when used, are short-lived and scoped.' },
    { kind: 'RUNTIME → GATEWAY → UI', badge: 'Complete', state: 'Completed', text: events[4].payload.delta, note: 'Completion is an explicit terminal event with a durable result reference. A closed socket or missing token is not proof that execution completed.', projection: 'The UI ends the working indicator, retains the table and citations, and can close the stream. A later page load reconstructs this view from the authorized final snapshot.', runtime: 'Commit the final result and terminal run state → publish run.completed through the outbox → release execution leases and transient resources. Retain checkpoints, receipts, and artifacts according to policy.' }
  ];
  const packetButtons = [...root.querySelectorAll('[data-proto-step]')];
  const viewButtons = [...root.querySelectorAll('[data-proto-view]')];
  let selected = 0;
  let viewMode = 'wire';
  let timer = null;
  let disconnected = false;
  let appliedCursor = 0;
  let duplicateCount = 0;
  const emptyView = () => ({ runId: 'run_42', cursor: 0, text: '', evidence: null, artifact: null, status: 'draft' });
  let uiView = emptyView();

  // A real reducer backs the simulated projection: retransmission is a no-op.
  function reduceUi(view, event) {
    if (!event || event.schema !== 'ui.event.v1' || !Number.isInteger(event.seq) || !event.payload) throw new Error('Unsupported event contract');
    if (event.run_id !== view.runId || event.seq <= view.cursor) return view;
    if (event.seq !== view.cursor + 1) throw new Error('Resync required: sequence gap');
    const next = { ...view, cursor: event.seq };
    switch (event.type) {
      case 'run.accepted': next.status = 'queued'; break;
      case 'progress': next.status = 'running'; break;
      case 'evidence.available': next.evidence = event.payload.evidence_ref; break;
      case 'output.delta': next.text += event.payload.delta; break;
      case 'artifact.ready': next.artifact = event.payload.artifact_id; break;
      case 'run.completed': next.status = 'completed'; break;
      default: throw new Error('Unsupported event type');
    }
    return next;
  }

  const sse = (event) => `id: ${event.run_id}:${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n// END OF WIRE FRAME\n// Inspector-only decoded data (not transmitted):\n${JSON.stringify(event, null, 2)}`;
  function setStatus(message) { $('proto-status').textContent = message; }
  function stop() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    $('proto-play').innerHTML = 'Play trace <span aria-hidden="true">▷</span>';
  }
  function renderCode() {
    const step = steps[selected];
    let value;
    if (!selected && viewMode === 'public') value = '// No runtime event yet.\n// Local optimistic UI state, awaiting 202 + run ID.\n\n' + JSON.stringify({ message_id: 'local_msg_1', status: 'submitting', content: command.input.text }, null, 2);
    else if (viewMode === 'public') value = sse(events[selected]);
    else if (step.wire) value = step.wire;
    else if (selected === 1) value = 'HTTP/1.1 202 Accepted\nContent-Type: application/json\n\n' + JSON.stringify({ request_id: 'req_17', run_id: 'run_42', events_url: '/v1/runs/run_42/events' }, null, 2) + '\n\n// Then GET the event stream:\n' + sse(events[1]);
    else value = sse(events[selected]);
    $('proto-code').textContent = value;
    viewButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.protoView === viewMode)));
  }
  function render() {
    const step = steps[selected];
    packetButtons.forEach((button, index) => {
      button.classList.toggle('is-active', index === selected);
      button.classList.toggle('is-dropped', disconnected && index > 3);
      button.setAttribute('aria-pressed', String(index === selected));
    });
    $('proto-packet-kind').textContent = step.kind;
    $('proto-packet-count').textContent = `${String(selected + 1).padStart(2, '0')} / 07`;
    $('proto-packet-note').textContent = step.note;
    $('proto-runtime-explain').textContent = step.runtime;
    $('proto-ui-state').textContent = disconnected ? 'Disconnected' : step.state;
    $('proto-ui-badge').textContent = disconnected ? 'Reconnecting' : step.badge;
    $('proto-ui-text').textContent = uiView.text || step.text;
    $('proto-ui-evidence').hidden = !uiView.evidence || Boolean(uiView.artifact);
    $('proto-ui-artifact').hidden = !uiView.artifact;
    $('proto-projection-note').textContent = step.projection;
    $('proto-cursor').textContent = `APPLIED CURSOR / ${appliedCursor}${duplicateCount ? ' · DUPLICATE IGNORED' : ''}`;
    $('proto-reconnect').disabled = !disconnected;
    $('proto-next').disabled = disconnected;
    $('proto-duplicate').disabled = selected < 1 || disconnected;
    renderCode();
  }
  function select(index, message) {
    selected = index;
    uiView = emptyView();
    for (let i = 1; i <= index; i += 1) uiView = reduceUi(uiView, events[i]);
    appliedCursor = uiView.cursor;
    duplicateCount = 0;
    render();
    if (message) setStatus(message);
  }
  function play(reconnect = false) {
    stop();
    if (selected === steps.length - 1 && !reconnect) select(0);
    disconnected = false;
    render();
    $('proto-play').textContent = 'Pause trace Ⅱ';
    if (!reconnect) setStatus('Playing the local trace. Each boundary reveals one packet and its UI projection.');
    timer = window.setInterval(() => {
      const next = selected + 1;
      if (next >= steps.length) { stop(); return; }
      select(next, reconnect ? `Replayed public seq ${next}; the UI applies it once in order.` : `Inspecting packet ${next + 1}: ${steps[next].kind.toLowerCase()}.`);
      if (next === steps.length - 1) {
        stop();
        setStatus(reconnect ? 'Reconnected: replayed seq 4–6. One table, one answer, zero repeated tool calls.' : 'Trace complete. Try a disconnect, duplicate delivery, or inspect any packet.');
      }
    }, 1300);
  }
  packetButtons.forEach((button) => button.addEventListener('click', () => {
    stop();
    disconnected = false;
    select(Number(button.dataset.protoStep), 'Inspecting a historical packet and the corresponding UI snapshot.');
  }));
  viewButtons.forEach((button) => button.addEventListener('click', () => { viewMode = button.dataset.protoView; renderCode(); }));
  $('proto-play').addEventListener('click', () => {
    if (timer !== null) { stop(); setStatus('Trace paused. Inspect a packet or continue.'); return; }
    if (disconnected) { setStatus('The stream is disconnected. Select Reconnect to replay from the applied cursor.'); return; }
    play();
  });
  $('proto-next').addEventListener('click', () => { stop(); select((selected + 1) % steps.length, 'Advanced one packet; the browser projection is shown alongside it.'); });
  $('proto-drop').addEventListener('click', () => {
    stop();
    disconnected = true;
    select(3, 'Connection lost after seq 3. The runtime finishes in the background; the UI still has only the evidence card.');
  });
  $('proto-reconnect').addEventListener('click', () => {
    setStatus('GET /runs/run_42/events · Last-Event-ID: run_42:3. Reauthorize, then replay retained seq 4–6.');
    play(true);
  });
  $('proto-duplicate').addEventListener('click', () => {
    stop();
    uiView = reduceUi(uiView, events[selected]);
    duplicateCount += 1;
    render();
    setStatus(`Duplicate seq ${appliedCursor} ignored (seq ≤ cursor). The rendered answer and artifact count are unchanged; no execution is retried.`);
  });
  $('proto-expired').addEventListener('click', () => {
    stop();
    disconnected = false;
    select(6, 'Replay cursor expired → authorized snapshot at seq 6 → replace UI state → resume after seq 6. A snapshot and its cursor must be consistent.');
    $('proto-resync-result').hidden = false;
    $('proto-resync-result').textContent = 'Snapshot restored at seq 6. The completed answer and table are rebuilt above; the run was not executed again.';
    $('proto-runtime-explain').textContent = 'The event gateway reports resync_required when the requested cursor is outside retention. The client closes the old stream, fetches a consistent authorized snapshot and cursor, replaces its view, and reopens after that cursor. The underlying run is not rerun.';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && timer !== null) { stop(); setStatus('Trace paused while the page is hidden.'); } });
  render();
})();

// Source-based LangGraph protocol explorer. The earlier laboratory remains a
// separately labelled design extension and does not describe the shipped proxy.
(() => {
  'use strict';
  const root = document.getElementById('protocol');
  if (!root || !root.querySelector('#proto-actual-code')) return;
  const $ = (id) => root.querySelector(`#proto-actual-${id}`);
  const json = (value) => JSON.stringify(value, null, 2);
  const human = { id: 'message_example', type: 'human', content: 'Summarize my uploaded draft.' };
  const call = { id: 'call_example', name: 'workspace_search', args: { query: 'uploaded draft', document_types: ['word'], limit: 8 }, type: 'tool_call' };
  const ai = { id: 'ai_example', type: 'ai', content: '', tool_calls: [call] };
  let selected = 0;
  let failed = false;
  const result = () => failed
    ? { status: 'error', error_code: 'workspace_index_search_failed', error: 'Index search failed', candidates: [] }
    : { status: 'ok', candidate_count: 1, candidates: [{ path: '/workspace/draft.docx', text_path: '/workspace/draft.docx.md', document_type: 'word', reader_tool: 'word_reader' }] };
  const toolMessage = () => ({ id: 'tool_message_example', type: 'tool', tool_call_id: 'call_example', content: JSON.stringify(result()) });
  const items = [
    { origin:'BROWSER → SDK', format:'SDK INPUT', title:'The request starts as a human message.', explain:'sendMessage constructs a human message with a client UUID and an optimistic UI entry. Pending graph file state can also be submitted. The SDK creates a server-backed thread when none is selected.', code:()=>'stream.submit(' + json({ messages:[human] }) + ', {\n  config: { recursion_limit: 999 },\n  optimisticValues: /* local message projection */\n})\n\n// SDK issues POST /threads/{thread_id}/runs/stream.\n// The response itself is an SSE stream.', note:'Source input shape: messages plus optional files. The application does not send run.command.v1, a custom tenant field, or a public seq counter.', caution:'The recursion limit is an execution-step limit, not a complete cost, deadline, or authorization policy.', source:'useChat.ts:171–194 · SDK client.js:610–647' },
    { origin:'NEXT.JS PROXY → LANGGRAPH', format:'HTTP REQUEST / SELECTED FIELDS', title:'Authorize the thread, forward the stream.', explain:'The proxy checks same-origin use, department entry and browser ownership. It overwrites owner metadata server-side and forwards the SDK request to the selected backend.', code:()=> 'POST /api/langgraph/threads/{thread_id}/runs/stream\nContent-Type: application/json\n\n' + json({ assistant_id:'configured_assistant', input:{messages:[human]}, stream_mode:['messages-tuple','values'], stream_resumable:true, on_disconnect:'continue', config:{recursion_limit:999}, metadata:{browser_owner:'<server-derived owner hash>'} }), note:'This is a representative request assembled from the installed SDK and proxy. The thread path and configured assistant select execution; neither is an employee identity or a grant to other threads.', caution:'Except for thread-search filtering, the proxy forwards upstream response bytes. There is no per-event tool-result redaction layer in this source.', source:'api/langgraph/[[...path]]/route.ts:32–118,172–187 · SDK stream.lgp.js:257–277' },
    { origin:'MODEL → GRAPH STATE → BROWSER', format:'AI MESSAGE / SELECTED FIELDS', title:'The tool call is an AI message field.', explain:'The model proposes workspace_search with arguments. Deep Agents dispatches the registered tool. The chat UI discovers tool_calls on the AI message and displays a pending tool card.', code:()=>json(ai), note:'Shown as the decoded AI message object, not a separate event named tool.call. The same message can be reconstructed from streamed chunks or appear in values state.', caution:'The current UI exposes tool names and arguments. The system prompt guides tool choice; this frontend display is not an approval gateway.', source:'ChatInterface.tsx:436–496 · runner.py:2292–2311,2597–2603' },
    { origin:'TOOL EXECUTOR → GRAPH → BROWSER', format:'TOOL MESSAGE / SELECTED FIELDS', title:'Match a result by tool_call_id.', explain:'The tool returns an observation. Its ToolMessage links back to call_example, so the frontend can attach result text to the corresponding AI tool-call card.', code:()=>json(toolMessage()), note:'content is a serialized tool result. Current ChatInterface marks the matching call completed when a ToolMessage arrives; it does not interpret every domain status as success or failure.', caution:'Response received is not business success. Toggle the error example: delivery still completes while status:error requires another model decision.', source:'ChatInterface.tsx:497–513 · runner.py:887–901' },
    { origin:'MODEL → SSE → SDK', format:'MESSAGES TUPLE / DECODED DATA', title:'Message chunks become readable text.', explain:'The installed SDK requests messages-tuple mode and receives messages events containing [serialized chunk, metadata]. It merges chunks by message ID before React renders stream.messages.', code:()=> 'event: messages\ndata: ' + JSON.stringify([{id:'reply_example',type:'AIMessageChunk',content: failed ? 'The document lookup failed. ' : 'I found the uploaded draft. '},{langgraph_node:'model'}]) + '\n\n// END OF ILLUSTRATIVE SSE FRAME\n// Selected tuple fields; node metadata varies by graph.\n// SDK merges by message id, not ui.event.v1.seq.', note:'The frame is representative, not a captured trace. values events separately replace or update graph state. Message chunks are not proof that a generated claim has been independently verified.', caution: failed ? 'A failed search can lead to revised arguments, another available lookup, or a clarification. The next call is not a guaranteed hardcoded recovery path.' : 'A response may precede more tool calls. Chat text and tool observations share the conversation; the frontend does not schedule the next call.', source:'SDK stream.lgp.js:427–429 · ui/manager.js:98–120 · ui/messages.js:MessageTupleManager' },
    { origin:'GRAPH STATE → SDK → FILE / TODO UI', format:'VALUES EVENT / SELECTED FIELDS', title:'Files and todos arrive in graph state.', explain:'After file and todo tools update graph state, useChat exposes values.files and values.todos. The file viewer reads that content; a user can separately invoke PDF or DOCX export.', code:()=> 'event: values\ndata: ' + JSON.stringify({files:{'/final_report.md':{content:['# Draft summary','…']}},todos:[{content:'Review source',status:'completed'}]}) + '\n\n// Selected state fields shown for readability.\n// A full values payload also carries messages.\n// This sample follows successful source reading;\n// it is not produced from the error example.', note:'Root report files use StateBackend. Physical uploads under /workspace are different resources. The report does not arrive via artifact.ready or a typed artifact-ID resolver in this application.', caution:'Export is POST /api/export with browser-provided content. A failed converter leaves the Markdown intact and returns a UI error; it does not automatically rerun the agent.', source:'useChat.ts:134–158,336–343 · runner.py:2584–2595 · FileViewDialog.tsx:98–110' }
  ];
  function render() {
    const item=items[selected];
    root.querySelectorAll('[data-proto-actual-step]').forEach((button)=>button.setAttribute('aria-pressed',String(Number(button.dataset.protoActualStep)===selected)));
    $('origin').textContent=item.origin; $('format').textContent=item.format; $('title').textContent=item.title; $('explain').textContent=item.explain;
    $('code').textContent=item.code(); $('code-note').textContent=item.note;
    $('caution').textContent=typeof item.caution === 'function' ? item.caution() : item.caution;
    if(selected===4) $('caution').textContent=failed?'A failed search can lead to revised arguments, another available lookup, or a clarification. The next call is not a guaranteed hardcoded recovery path.':'A response may precede more tool calls. The frontend renders observations; it does not schedule the next call.';
    $('source').textContent='SOURCE / '+item.source;
    $('tool').hidden=selected<2||selected===5;
    $('tool-status').textContent=selected===2?'Pending · awaiting ToolMessage':failed?'Completed delivery · payload status: error':'Completed delivery · payload status: ok';
    $('files').hidden=selected!==5;
    $('message').textContent=selected<2?'Local human message · waiting for the run':selected===2?'The runtime executes the selected tool.':selected===3?(failed?'Tool observation received. The model must decide how to continue.':'Candidate received. The model can now read the returned text_path.'):selected===4?(failed?'The document lookup failed. …':'I found the uploaded draft. …'):'A report file and a task update are visible in their own UI panels.';
    $('status').textContent=`Boundary ${selected+1} of ${items.length}: ${item.title}${failed&&selected===3?' Error observation selected.':''}`;
  }
  root.querySelectorAll('[data-proto-actual-step]').forEach((button)=>button.addEventListener('click',()=>{selected=Number(button.dataset.protoActualStep);if(selected===5){failed=false;$('failure').checked=false;}render();}));
  $('failure').addEventListener('change',()=>{failed=$('failure').checked;selected=3;render();});
  render();
})();

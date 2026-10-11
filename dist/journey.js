(() => {
  'use strict';
  const root = document.getElementById('journey-lab');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const json = value => JSON.stringify(value, null, 2);
  const number = index => String(index + 1).padStart(2, '0');
  let scenario = 'simple', position = 0, timer = null;
  let sequence = [], specification = {};
  const defaults = { owner: 'MODEL', nodes: ['model'], wire: 'act', kicker: 'MODEL TURN', title: '', explanation: '', purpose: '', contract: '', evidence: 'Application instructions + framework tool loop', event: '', kind: 'AIMessage', packet: {}, uiStatus: 'Working', ui: 'The interface projects messages and tool activity as the Agent continues.', tag: 'WORKING', references: [], artifact: null, tool: 'Model chooses the next action', error: false };
  const step = value => ({ ...defaults, ...value });
  function makeScenario() {
    const operations = $('journey-group').value === 'operations';
    const domain = operations ? 'maintenance' : 'travel';
    const label = operations ? 'Operations' : 'Office';
    const context = (request, title) => step({ owner: 'CLIENT', nodes: ['context'], wire: 'context', tab: 'Context', kicker: 'SCOPED INPUT', title: 'Start with the actual question.', explanation: `${label} department selection chooses a backend and its resource roots. This message joins the current thread history, system instructions, and the shared tool registry.`, purpose: 'Use the question and reachable resources to decide what work is necessary. The selected group does not manufacture a new Agent or grant arbitrary tools.', contract: 'Human message + thread state → model context', evidence: 'Department routing + useStream submission', event: 'human.message', kind: 'INPUT', packet: { messages: [{ type: 'human', content: request }] }, uiStatus: 'Ready to run', ui: request, tag: 'CONTEXT', tool: 'Awaiting first model turn', uiTitle: title });
    let callId = 0;
    const call = (name, args, title, purpose, options = {}) => {
      callId += 1;
      return step({ tab: options.tab || name.replace('knowledge_', '').replace('workspace_', ''), nodes: options.nodes || ['model', 'act'], wire: options.wire || 'act', title, explanation: `The model emits a structured ${name} call. The runtime resolves the registered function and injects its execution context; the browser does not choose or execute the tool.`, purpose, contract: 'AIMessage.tool_calls → registered tool', event: name, packet: { type: 'ai', tool_calls: [{ id: `call_${callId}`, name, args }] }, tool: name, ...options });
    };
    const observe = (result, title, purpose, options = {}) => step({ owner: 'TOOL', nodes: ['observe'], wire: 'observe', tab: 'Observe', kicker: 'TOOL OBSERVATION', title, explanation: 'The tool result returns to the conversation as a ToolMessage linked to its call ID. The next model turn can use this new information to choose another call or finish.', purpose, contract: 'ToolMessage → next model turn', event: 'tool.result', kind: 'ToolMessage', packet: { type: 'tool', tool_call_id: `call_${callId}`, content: JSON.stringify(result) }, tool: 'Result appended to messages', ...options });
    const plan = (todos, title, purpose) => call('write_todos', { todos }, title, purpose, { tab: 'Plan', nodes: ['plan', 'model'], wire: 'plan', kicker: 'OPTIONAL PLANNING', explanation: 'TodoListMiddleware provides write_todos. Calling it updates the todo state and returns a tool message. This tracks a complex objective; it does not compile an immutable sequence of future tool calls.', contract: 'write_todos → state.todos + ToolMessage', evidence: 'Built-in TodoListMiddleware; optional for simple tasks', uiStatus: 'Tracking a multi-step task', tag: 'PLAN' });
    const answer = (text, options = {}) => step({ tab: 'Answer', nodes: ['model', 'answer'], wire: 'answer', kicker: 'LOOP EXIT', title: 'Finish when the response is ready.', explanation: 'The model emits an answer with no new tool calls. The framework exits the tool loop, and the UI renders the answer with any available citations or output files.', purpose: 'Deliver the requested result. Completing a todo list is not itself an answer; the final message carries the useful content.', contract: 'AIMessage without tool_calls → final UI', evidence: 'Framework no-tool-call exit + messages/files projection', event: 'assistant.answer', kind: 'AIMessage', packet: { type: 'ai', content: text, tool_calls: [] }, uiStatus: 'Complete', ui: text, tag: 'DONE', tool: 'No pending tool calls', ...options });
    const policyPath = `/knowledge/${domain}-policy.md`;
    const searchResult = { status: 'ok', candidate_count: 1, candidates: [{ title: `${domain} approval policy`, category: 'Procedures', knowledge_path: policyPath, reader_tool: 'knowledge_document_reader' }] };
    const request = `What does the ${domain} policy say about approval?`;
    const firstSearch = () => call('knowledge_search', { query: `${domain} approval` }, 'Select a search, not a whole workflow.', 'This is a reference question. The prompt directs the Agent to search compact knowledge metadata before opening candidate documents.', { tab: 'Search', uiStatus: 'Finding a relevant policy', tag: 'SEARCH' });
    const readPolicy = () => call('knowledge_document_reader', { knowledge_path: policyPath }, 'Open the candidate that can support the answer.', 'A metadata match identifies a likely source but does not establish its content. Read the returned Markdown record before stating a policy.', { tab: 'Read', wire: 'replan', uiStatus: 'Reading the selected evidence', tag: 'READ' });
    const policyObservation = () => observe({ status: 'ok', knowledge_path: policyPath, content: scenario === 'weak' ? 'Approval must be recorded before the activity starts. Urgent requests follow the same approval path.' : 'Approval must be recorded before the activity starts.', truncated: false }, 'Now there is source content to answer from.', 'The returned passage supports a narrow answer. This lookup has no need for a todo list, an audio tool, or another Agent.', { uiStatus: 'Evidence found', references: [`Source: ${domain} policy · approval section`], tag: 'EVIDENCE' });
    const policyAnswer = () => answer(scenario === 'weak' ? 'The example policy says urgent requests follow the same approval path: approval must be recorded before the activity starts. See the cited section.' : 'The example policy requires approval to be recorded before the activity starts. See the cited approval section.', { references: [`[1] ${domain} policy · approval section`], uiTitle: 'Cited policy answer' });
    if (scenario === 'simple') return { request, title: 'Policy question', hasPlan: false, steps: [context(request, 'Policy question'), firstSearch(), observe(searchResult, 'A candidate comes back.', 'The search returns a record path and metadata. The model chooses whether this candidate is relevant enough to read.', { uiStatus: 'Candidate selected', tag: 'MATCH' }), readPolicy(), policyObservation(), policyAnswer()] };
    if (scenario === 'weak') return { request: `How does ${domain} approval work for an urgent request?`, title: 'Refining a search', hasPlan: false, steps: [
      context(`How does ${domain} approval work for an urgent request?`, 'Refining a search'),
      call('knowledge_search', { query: `${domain} requests` }, 'Begin with the topic supplied by the user.', 'Start at the metadata index. The first formulation may be too broad to find the specific approval rule.', { tab: 'Search', tag: 'SEARCH' }),
      observe({ status: 'ok', candidates: [{ title: `${domain} overview`, category: 'Procedures', summary: 'General information; no urgent approval rule.' }] }, 'A successful tool call can still be unhelpful.', 'The service worked, but its observation does not answer the question. This is weak evidence, not a transport error.', { tag: 'WEAK HIT', uiStatus: 'Refining the question' }),
      call('knowledge_search', { query: `${domain} urgent approval`, categories: ['Procedures'] }, 'Change the next call using the observation.', 'The prompt permits a more specific query and a category returned by the previous search. The model changes arguments instead of retrying the identical request.', { tab: 'Refine', wire: 'replan', kicker: 'MODEL-DRIVEN REPLANNING', tag: 'REFINE' }),
      observe(searchResult, 'The revised search finds a useful candidate.', 'Only this selected record needs to be read. The Agent is instructed not to replace weak search results with a full-corpus scan.', { tag: 'MATCH', uiStatus: 'Relevant candidate found' }), readPolicy(), policyObservation(), policyAnswer()
    ] };
    if (scenario === 'document') {
      const request = 'Compare the two uploaded reports and write a concise summary file.';
      return { request, title: 'Report synthesis', hasPlan: true, steps: [
        context(request, 'Report synthesis'),
        plan([{ content: 'Find and compare both reports', status: 'in_progress' }, { content: 'Write a cited summary file', status: 'pending' }], 'Track the work because it has several parts.', 'A small todo list keeps document coverage and the output requirement visible. Its items can change as the Agent sees the files.'),
        call('workspace_search', { query: 'uploaded reports', document_types: ['pdf'] }, 'Find relevant uploads before reading.', 'The upload index contains titles, summaries, and text-sidecar paths. Use those candidates instead of traversing the entire workspace.', { tab: 'Find uploads', uiStatus: 'Locating the two reports' }),
        observe({ status: 'ok', candidates: [{ path: '/workspace/report-a.pdf', text_path: '/workspace/report-a.pdf.md' }, { path: '/workspace/report-b.pdf', text_path: '/workspace/report-b.pdf.md' }] }, 'Reuse the text prepared at upload time.', 'These uploads already have text sidecars. Format-specific PDF parsing is unnecessary for this comparison unless the text lacks needed detail.', { tag: '2 FILES' }),
        call('read_file', { file_path: '/workspace/report-a.pdf.md' }, 'Read the first selected report.', 'The Agent reads source content through the virtual filesystem and carries its key evidence into the next model turn.', { tab: 'Read A', wire: 'replan' }),
        observe({ excerpt: 'Report A: two milestones completed; one dependency unresolved.' }, 'The first report supplies half the comparison.', 'The other selected report is still needed. A partial result changes what remains on the task, rather than ending the request.', { tag: 'PARTIAL' }),
        call('read_file', { file_path: '/workspace/report-b.pdf.md' }, 'Choose the missing source next.', 'The next call follows the evidence gap: read report B. Other available tools remain unused because they do not serve this objective.', { tab: 'Read B', wire: 'replan' }),
        observe({ excerpt: 'Report B: the unresolved dependency was resolved; a review remains.' }, 'Compare the new observation with the earlier one.', 'The model now has both source passages. It can synthesize the change, identify the remaining review, and write the requested output.', { tag: 'COMPARE', references: ['Report A · milestones', 'Report B · updates'] }),
        call('write_file', { file_path: '/summary.md', content: 'Summary: the dependency is resolved; review remains. Sources: report A, report B.' }, 'Create the requested deliverable.', 'Root-level output files use StateBackend in the inspected composition. Uploaded inputs and read-only knowledge have separate storage routes.', { tab: 'Write file', wire: 'replan', tag: 'WRITE' }),
        observe({ path: '/summary.md', error: null }, 'The write result confirms the artifact exists.', 'A successful tool result is available to the parent. The UI file map can expose the output without becoming the owner of orchestration.', { tag: 'FILE READY', artifact: 'summary.md' }),
        plan([{ content: 'Find and compare both reports', status: 'completed' }, { content: 'Write a cited summary file', status: 'completed' }], 'Update task state after the work completes.', 'The plan reflects completed observations and the successful write. A user-facing answer still follows.'),
        answer('The comparison is ready: the earlier dependency is resolved, and a review remains. The summary file includes both sources.', { artifact: 'summary.md', references: ['[1] Report A', '[2] Report B'] })
      ] };
    }
    if (scenario === 'audio') {
      const request = 'Turn the uploaded meeting recording into a refined transcript and meeting minutes.';
      return { request, title: 'Meeting minutes', hasPlan: true, steps: [
        context(request, 'Meeting minutes'),
        plan([{ content: 'Locate the recording and obtain its transcript', status: 'in_progress' }, { content: 'Refine and prepare minutes', status: 'pending' }], 'Plan a task with distinct output requirements.', 'The requested transcript and minutes justify tracking. Planning is a tool capability selected for this objective.'),
        call('workspace_search', { query: 'meeting recording', document_types: ['audio_video'] }, 'Locate the recording and its existing metadata.', 'Search before reading or transcribing. A usable ASR sidecar can be reused; this particular example needs a fresh transcript.', { tab: 'Find audio', tag: 'SEARCH' }),
        observe({ status: 'ok', candidates: [{ path: '/workspace/meeting.m4a', text_path: null }] }, 'The chosen recording needs transcription.', 'The missing sidecar determines the next action. Another execution with an available transcript can skip ASR.', { tag: 'AUDIO' }),
        call('audio_transcribe', { virtual_audio_path: '/workspace/meeting.m4a' }, 'The parent invokes the ASR tool.', 'The application normalizes the audio and calls its ASR service. The custom subagent receives text later; it is not sent the raw audio task.', { tab: 'ASR', wire: 'replan', tag: 'ASR' }),
        observe({ status: 'ok', text: 'We will review the draft next week; the owner is not confirmed.', language: 'en', chunk_count: 1, text_path: '/workspace/meeting.m4a.md' }, 'A transcript becomes a new piece of context.', 'The raw text contains an unresolved owner. The specialist should preserve that uncertainty instead of inventing a person or decision.', { tag: 'TRANSCRIPT', uiStatus: 'Transcript available' }),
        call('task', { subagent_type: 'transcription-processing-agent', description: 'Refine the supplied transcript and produce minutes. Preserve unresolved ownership. Transcript: We will review the draft next week; the owner is not confirmed.' }, 'Delegate a focused text task.', 'The parent supplies a specific task description. The subagent starts with fresh messages rather than inheriting the full parent conversation or todo list.', { tab: 'Delegate', nodes: ['model', 'act', 'delegate'], wire: 'delegate', kicker: 'OPTIONAL SUBAGENT', tag: 'SUBAGENT', uiStatus: 'Refining the transcript' }),
        observe({ refined_transcript: 'The draft will be reviewed next week. The owner has not been confirmed.', minutes: { decision: 'Review draft next week', unresolved: 'Owner' } }, 'Return the specialist’s result to the parent.', 'The task tool returns the child’s final answer as a tool observation, with applicable state updates. The parent decides how to present or save the result.', { nodes: ['delegate', 'observe'], wire: 'return', tab: 'Return', evidence: 'SubAgentMiddleware task → child → ToolMessage', tag: 'RETURNED' }),
        call('write_file', { file_path: '/meeting-minutes.md', content: 'Refined transcript and minutes. Review: next week. Owner: unresolved.' }, 'The parent writes the final document.', 'Application instructions assign file operations to the parent. That is prompt guidance; the library also equips subagents with filesystem middleware.', { tab: 'Save', wire: 'replan', tag: 'WRITE' }),
        observe({ path: '/meeting-minutes.md', error: null }, 'The output is ready to present.', 'The file result is part of the Agent state projected by the UI.', { tag: 'FILE READY', artifact: 'meeting-minutes.md' }),
        plan([{ content: 'Locate the recording and obtain its transcript', status: 'completed' }, { content: 'Refine and prepare minutes', status: 'completed' }], 'Close the tracked work.', 'Both requested outputs have been produced; unresolved facts remain explicitly marked.'),
        answer('The refined transcript and meeting minutes are ready. The draft review is recorded for next week; the owner remains unresolved.', { artifact: 'meeting-minutes.md', references: ['Source: supplied meeting transcript'] })
      ] };
    }
    const errorRequest = `What is the latest ${domain} exception rule?`;
    return { request: errorRequest, title: 'An explicit evidence gap', hasPlan: false, steps: [
      context(errorRequest, 'An explicit evidence gap'), firstSearch(), observe(searchResult, 'The index returns a candidate.', 'A listed path can become stale; the reader still has to open the record successfully.', { tag: 'CANDIDATE' }), readPolicy(),
      observe({ status: 'error', error_code: 'knowledge_record_not_found', knowledge_path: policyPath }, 'An error returns as data, not an answer.', 'The knowledge reader returns a structured failure without terminating the run. The model can change its next call; this is not proof of an automatic retry policy.', { tab: 'Tool error', error: true, tag: 'ERROR', uiStatus: 'Source unavailable' }),
      call('knowledge_search', { query: `${domain} exception current policy` }, 'Reconsider the lookup after the failed read.', 'Search for another relevant candidate. The model adapts to a structured tool result; no generic exponential-backoff mechanism is implied.', { tab: 'Reconsider', wire: 'replan', kicker: 'MODEL-DRIVEN ADAPTATION', tag: 'REPLAN' }),
      observe({ status: 'ok', candidate_count: 0, candidates: [] }, 'No usable supporting source was found.', 'The prompt instructs the Agent to record a knowledge miss and use a fixed no-hit response. It must not fill the evidence gap with an invented policy.', { tag: 'NO HIT', uiStatus: 'No supported answer' }),
      call('record_knowledge_no_hit', { question: errorRequest, keywords: [`${domain} exception`] }, 'Make the evidence gap visible to maintainers.', 'The application records a knowledge miss for later corpus enrichment. This is an explicit fallback, not a successful policy answer.', { tab: 'Record miss', wire: 'replan', tag: 'NO HIT' }),
      observe({ event_type: 'knowledge_no_hit', question: errorRequest }, 'The miss has been recorded.', 'The run can finish honestly with the prescribed fallback instead of searching indefinitely.', { tag: 'RECORDED' }),
      answer('No supported answer is available. Ask the knowledge owner to add relevant material.', { title: 'Stop with an explicit evidence gap.', uiStatus: 'Evidence needed', tag: 'NO HIT', purpose: 'This is an English rendering of the configured no-hit response. The actual prompt specifies its fixed response in Chinese.', error: true })
    ] };
  }
  function pause() { if (timer !== null) clearInterval(timer); timer = null; $('journey-play').textContent = position === sequence.length - 1 ? '↺ Replay' : '▶ Play loop'; $('journey-play').setAttribute('aria-label', 'Play illustrative Agent execution'); }
  function renderTabs() {
    $('journey-steps').replaceChildren(...sequence.map((item,index) => { const button=document.createElement('button');button.type='button';button.dataset.journeyIndex=String(index);const label=document.createElement('span');label.textContent=number(index);button.append(label,document.createTextNode(item.tab || item.event));return button; }));
  }
  function render() {
    const current=sequence[position];
    const text = { 'journey-inspector-title':current.title,'journey-inspector-kicker':`${number(position)} / ${current.kicker}`,'journey-owner':current.owner,'journey-explanation':current.explanation,'journey-runtime-work':current.purpose,'journey-boundary':current.contract,'journey-invariant':current.evidence,'journey-ui-title':current.uiTitle || specification.title,'journey-ui-status':current.uiStatus,'journey-ui-body':current.ui,'journey-ui-indicator':current.tag,'journey-payload-kind':current.kind,'journey-tool-state':current.tool,'journey-position':`Action ${number(position)} / ${String(sequence.length).padStart(2,'0')}` };
    Object.entries(text).forEach(([id,value])=>$(id).textContent=value);
    $('journey-payload').textContent=json(current.packet);
    $('journey-input').textContent=json({messages:[{type:'human',content:specification.request}]});
    $('journey-request-text').textContent=`“${specification.request}”`;
    $('journey-plan-state').textContent=specification.hasPlan ? (sequence.slice(0,position+1).some(s=>s.nodes.includes('plan')) ? 'Todo planning: used for this task' : 'Todo planning: available if useful') : 'Todo planning: not needed';
    const priorObservations=sequence.slice(0,position+1).reverse();
    const references=priorObservations.find(item=>item.references.length)?.references || [];
    const artifact=priorObservations.find(item=>item.artifact)?.artifact || null;
    $('journey-evidence').hidden=references.length===0;
    $('journey-evidence').textContent=references.join(' · ');
    $('journey-artifact').hidden=!artifact;
    $('journey-artifact-name').textContent=artifact || 'Output file';
    $('journey-next').disabled=position===sequence.length-1;
    const available=new Set(sequence.flatMap(s=>s.nodes)),visited=new Set(sequence.slice(0,position).flatMap(s=>s.nodes));
    root.querySelectorAll('[data-journey-node]').forEach(node=>{const name=node.dataset.journeyNode,active=current.nodes.includes(name);node.classList.toggle('is-current',active);node.classList.toggle('is-complete',!active&&visited.has(name));node.classList.toggle('is-error',active&&current.error);node.disabled=!available.has(name);node.setAttribute('aria-pressed',String(active));});
    const visitedWires=new Set(sequence.slice(0,position).map(s=>s.wire));
    root.querySelectorAll('[data-journey-wire]').forEach(wire=>{const name=wire.dataset.journeyWire;wire.classList.toggle('is-current',current.wire===name);wire.classList.toggle('is-complete',current.wire!==name&&visitedWires.has(name));});
    root.querySelectorAll('[data-journey-index]').forEach(button=>{const index=Number(button.dataset.journeyIndex);button.classList.toggle('is-current',index===position);button.classList.toggle('is-complete',index<position);button.setAttribute('aria-pressed',String(index===position));});
    const actionRail=$('journey-steps'),activeButton=actionRail.querySelector('.is-current');
    if(activeButton)actionRail.scrollLeft=Math.max(0,activeButton.getBoundingClientRect().left-actionRail.getBoundingClientRect().left+actionRail.scrollLeft-actionRail.clientWidth/2+activeButton.clientWidth/2);
    $('journey-event-trail').replaceChildren(...sequence.slice(0,position+1).map((item,index)=>{const li=document.createElement('li');const seq=document.createElement('span');seq.textContent=number(index);li.append(seq,document.createTextNode(item.event));return li;}));
    $('journey-event-trail').scrollLeft=$('journey-event-trail').scrollWidth;
    const operations=$('journey-group').value==='operations';
    $('journey-context-label').textContent=`${operations?'Operations':'Office'} resources · existing thread · ${$('journey-provider').selectedOptions[0].text}`;
    if(position===sequence.length-1 || timer===null)pause();
  }
  function resetScenario() {pause();specification=makeScenario();sequence=specification.steps;position=0;renderTabs();render();}
  function move(index) {pause();position=Math.max(0,Math.min(index,sequence.length-1));render();}
  $('journey-scenario').addEventListener('change',event=>{scenario=event.target.value;resetScenario();});
  $('journey-group').addEventListener('change',resetScenario);
  $('journey-provider').addEventListener('change',()=>{pause();render();});
  $('journey-next').addEventListener('click',()=>move(position+1));
  $('journey-reset').addEventListener('click',()=>move(0));
  $('journey-steps').addEventListener('click',event=>{const button=event.target.closest('[data-journey-index]');if(button)move(Number(button.dataset.journeyIndex));});
  root.querySelectorAll('[data-journey-node]').forEach(node=>node.addEventListener('click',()=>{const name=node.dataset.journeyNode;let index=sequence.findIndex((item,i)=>i>position&&item.nodes.includes(name));if(index<0)index=sequence.findIndex(item=>item.nodes.includes(name));if(index>=0)move(index);}));
  $('journey-play').addEventListener('click',()=>{if(timer!==null){pause();return;}if(position===sequence.length-1){position=0;render();}$('journey-play').textContent='Ⅱ Pause';$('journey-play').setAttribute('aria-label','Pause illustrative Agent execution');timer=setInterval(()=>{position=Math.min(position+1,sequence.length-1);render();},3500);});
  $('journey-download').addEventListener('click',()=>{const data={schema:'fieldnotes.implemented-contract-example.v2',synthetic:true,description:'Illustrative execution of implemented contracts; not captured telemetry or a mandatory workflow.',scenario,resource_context:$('journey-group').value,model_connection:$('journey-provider').value,request:specification.request,actions:sequence.slice(0,position+1).map((item,index)=>({index:index+1,event:item.event,owner:item.owner,contract:item.contract,purpose:item.purpose,example:item.packet}))};const url=URL.createObjectURL(new Blob([json(data)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=`agent-loop-${scenario}-example.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.JourneyLab=Object.freeze({getState:()=>Object.freeze({scenario,position,total:sequence.length,step:sequence[position].event,playing:timer!==null,planned:specification.hasPlan,group:$('journey-group').value,provider:$('journey-provider').value,events:Object.freeze(sequence.slice(0,position+1).map(s=>s.event))})});
  resetScenario();
})();

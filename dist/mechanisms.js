(() => {
  'use strict';
  const app = document.getElementById('mech-app');
  if (!app) return;
  const el = (id) => document.getElementById(`mech-${id}`);
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const refs = {
    rrf: ['Elastic · reciprocal rank fusion', 'https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion'],
    rls: ['PostgreSQL · row security', 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html'],
    txn: ['PostgreSQL · transaction isolation', 'https://www.postgresql.org/docs/current/transaction-iso.html'],
    retry: ['AWS · idempotent API retries', 'https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/'],
    fair: ['Kubernetes · priority & fairness', 'https://kubernetes.io/docs/concepts/cluster-administration/flow-control/'],
    cache: ['vLLM · prefix cache design', 'https://docs.vllm.ai/en/latest/design/prefix_caching/'],
    attention: ['Hugging Face · KV caching', 'https://huggingface.co/docs/transformers/main/cache_explanation'],
    graph: ['MindSpore · graph-kernel fusion', 'https://www.mindspore.cn/docs/en/r2.1/design/graph_fusion_engine.html'],
    ascend: ['Ascend C · Matmul tiling', 'https://www.hiascend.com/document/detail/en/CANNCommunityEdition/850/opdevg/Ascendcopdevg/atlas_ascendc_10_10012.html'],
    lower: ['MLIR · dialect conversion', 'https://mlir.llvm.org/docs/DialectConversion/']
  };
  const models = {
    query: {category:'01 / QUERY & RETRIEVAL',title:'Evidence before generation.',description:'A question becomes a scoped retrieval plan. Lexical search catches exact terms; vectors find related meaning. Authorized candidates are fused, reranked, and passed to the model with source references.',steps:4,detail:'The runtime resolves identity and purpose before retrieval. Apply equivalent access filters to lexical and vector indexes, then recheck returned records at the data boundary. Reciprocal rank fusion combines ranks rather than incompatible raw scores; a reranker estimates relevance within the allowed candidate set.',invariant:'A high similarity score never grants access. Source version, chunk ID, and retrieval scope travel with every citation; retrieved text is evidence, not executable authority.',sources:['rrf','rls'],defaults:{scope:'team',rerank:true}},
    collaboration:{category:'02 / MULTI-USER STATE',title:'Shared work. Explicit versions.',description:'Two people can work on one artifact without inheriting each other’s private context. Follow concurrent edits through role checks, a version comparison, and a conflict-aware retry.',steps:4,detail:'Each client submits a patch with workspace ID and expected version. The server checks membership and update permission, then atomically compares and advances the version. The loser reloads the new snapshot and rebases or asks the user to resolve overlapping edits. Presence notifications do not replace durable state.',invariant:'The shared artifact is the collaboration boundary. Private prompts, credentials, and hidden tool results are not implicitly broadcast; every subscriber is authorized independently.',sources:['txn','rls'],defaults:{role:'editor'}},
    departments:{category:'03 / CROSS-DEPARTMENT COLLABORATION',title:'Join products, preserve boundaries.',description:'A purchasing analysis needs Finance, Operations, and Legal. Departments contribute approved data products for a specific purpose; a common workspace does not create universal data access.',steps:3,detail:'The coordinator requests typed outputs under delegated, purpose-limited capabilities. Finance publishes an aggregate budget view, Operations publishes approved demand, and Legal exposes clearance status. Each source enforces its own row and column policy. The join records lineage and the policy version used.',invariant:'A joined result must retain applicable source restrictions. Recheck the recipient before publishing; an approval for procurement does not authorize reuse for marketing.',sources:['rls'],defaults:{approved:false,purpose:'procurement'}},
    resilience:{category:'04 / AUTHORITY & RESILIENCE',title:'Recover state. Reconcile effects.',description:'Authentication identifies the caller. Authorization decides each action. A durable checkpoint and an idempotency record make an uncertain external outcome something the runtime can investigate.',steps:5,detail:'Bind each tool call to actor, resource, action, policy version, and a bounded capability. Persist the intended effect before execution. A timeout may occur after the provider committed: query the effect status by idempotency key before retrying. Use deadlines, backoff, retry limits, and explicit compensation where supported.',invariant:'Never retry a denied action. Never infer “no effect” from a network timeout. Exactly-once business outcomes require provider deduplication or a transactional design; a checkpoint alone cannot guarantee them.',sources:['retry','rls'],defaults:{fault:'timeout'}},
    threads:{category:'05 / CONCURRENT EXECUTION',title:'Parallel tasks, one commit boundary.',description:'Independent reads can overlap. Dependent work must wait. Change the worker budget to see a request DAG become a bounded execution schedule, then step through its logical clock.',steps:8,detail:'Logical task IDs are durable; OS threads and worker processes are replaceable execution resources. A semaphore caps in-flight work. Each branch returns an immutable result with its own deadline and trace span. The join waits for required results, cancels obsolete siblings, then commits one versioned update.',invariant:'More workers do not remove dependencies. Shared mutable state is not written by parallel branches, and tenant quotas prevent a large fan-out from monopolizing the worker pool.',sources:['fair','txn'],defaults:{workers:2}},
    kv:{category:'06 / KV CACHE',title:'Compute the prefix once.',description:'During prefill, the model creates key and value tensors for prompt tokens at every attention layer. During decode, project the current token into Q/K/V, append its K/V, attend to history including that token, and predict the next token.',steps:5,detail:'For a compatible causal decoder, previous token representations do not need recomputation at every decode step. Paged storage maps logical token blocks to physical memory. Prefix reuse requires the same token IDs and positions, model and adapter revision, multimodal inputs, and an allowed cache-isolation domain.',invariant:'KV tensors are model state, not an answer cache or a database. New queries still read prior K/V during attention. Cross-tenant reuse is disabled here even when token text matches; applications must choose an explicit isolation policy.',sources:['attention','cache'],defaults:{prefix:'same'}},
    scheduling:{category:'07 / CACHE-AWARE SCHEDULING',title:'Locality meets a latency budget.',description:'The warmest worker is not always the fastest available worker. Route an admitted request using estimated queue time, prefill work, prefix locality, and memory headroom—inside a fair tenant queue.',steps:4,detail:'Admission first enforces tenant quotas and reserves enough KV capacity. A router can estimate queue wait plus uncached prefill and any transfer cost, then update the estimate with measured service times. Inside a worker, continuous batching admits or retires sequences each iteration; it is distinct from cluster-level routing.',invariant:'Cache affinity is a preference, not a permission. Tenant isolation, cancellation, deadlines, and memory limits remain hard constraints. Eviction can reclaim only eligible blocks; active references must remain valid.',sources:['fair','cache'],defaults:{load:35,locality:true}},
    operators:{category:'08 / DOMESTIC HARDWARE & OPERATORS',title:'Port the execution, verify the meaning.',description:'Hardware adaptation happens below the agent API: graph legalization, operator lowering, fusion and tiling, device execution, and numerical validation. Explore one concrete Ascend path and a portable CPU reference.',steps:5,detail:'An adapter must match the framework, CANN or runtime, driver, firmware, and device generation. Shape, dtype, alignment, and memory limits constrain legal kernels. RMSNorm uses reduction and scaling; RoPE rotates paired features; Matmul tiles matrix dimensions. Fusion is selected only when data dependencies and numerical requirements permit it.',invariant:'A successful compilation is not acceptance. Compare numerical error and task quality with the reference, then measure prefill, decode, throughput, and memory. Supported precision and operator coverage vary by device and software version.',sources:['lower','graph','ascend'],defaults:{target:'ascend',operator:'matmul'}}
  };
  let active = 'query';
  let stage = 0;
  let values = {...models.query.defaults};
  const stepCount = () => active === 'threads' ? Math.ceil(3 / Number(values.workers)) * 2 + 2 : models[active].steps;
  const text = (x,y,value,cls='',anchor='start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;
  const box = (x,y,w,h,title,sub='',status='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" class="mech-node${status ? ` mech-node-${status}` : ''}"/>${text(x+w/2,y+(sub?29:h/2+5),title,'','middle')}${sub?text(x+w/2,y+51,sub,'mech-small','middle'):''}`;
  const edge = (d,status='',arrow=true) => `<path d="${d}" class="mech-edge${status?`-${status}`:''}"${arrow?' marker-end="url(#mech-arrow)"':''}/>`;
  const tag = (x,y,label,color='#64ddcc') => `<circle cx="${x}" cy="${y-4}" r="3" fill="${color}"/>${text(x+10,y,label,'mech-mono')}`;
  const svg = (body,description,height=410) => `<svg viewBox="0 0 900 ${height}" role="img" aria-label="${esc(description)}"><defs><marker id="mech-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 9 5 1 9" fill="none" stroke="#91b1c3" stroke-width="1.4"/></marker></defs>${body}</svg>`;
  const select = (id,label,options) => `<label class="mech-control" for="mech-control-${id}">${label}<select id="mech-control-${id}" data-mech-input="${id}">${options.map(([v,l])=>`<option value="${v}"${values[id]===v?' selected':''}>${l}</option>`).join('')}</select></label>`;
  const toggle = (id,label) => `<label class="mech-toggle"><input type="checkbox" data-mech-input="${id}"${values[id]?' checked':''}>${label}</label>`;
  const range = (id,label,min,max,step=1) => `<label class="mech-control" for="mech-control-${id}">${label}<input id="mech-control-${id}" data-mech-input="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${values[id]}"><output for="mech-control-${id}" id="mech-output-${id}">${values[id]}</output></label>`;
  function controls() {
    let c='';
    if(active==='query') c=select('scope','Access scope',[['team','Operations team'],['finance','Finance + Operations']])+toggle('rerank','Apply reranker');
    if(active==='collaboration') c=select('role','Bob’s workspace role',[['editor','Editor · may update'],['viewer','Viewer · read only']]);
    if(active==='departments') c=select('purpose','Declared purpose',[['procurement','Procurement analysis'],['marketing','Marketing campaign']])+toggle('approved','Approve Finance aggregate for procurement');
    if(active==='resilience') c=select('fault','Failure scenario',[['timeout','Timeout after provider commit'],['transient','Temporary failure before commit'],['denied','Policy denies the action']]);
    if(active==='threads') c=range('workers','Worker slots',1,3);
    if(active==='kv') c=select('prefix','Incoming prompt',[['same','Same prefix · same tenant'],['cold','New prefix · cold cache'],['edited','Edit token 4 · same tenant'],['tenant','Same text · different tenant']]);
    if(active==='scheduling') c=range('load','Worker A utilization (%)',15,95,5)+toggle('locality','Consider authorized prefix locality');
    if(active==='operators') c=select('target','Execution target',[['ascend','Ascend NPU · CANN adapter'],['cpu','Portable CPU reference']])+select('operator','Operator',[['matmul','Matmul'],['rmsnorm','RMSNorm'],['rope','RoPE']]);
    c+=`<div class="mech-action"><span id="mech-step-count" class="mech-step-count"></span><button type="button" id="mech-next">${active==='kv'?'Decode token':active==='scheduling'?'Route request':'Next step'} <span aria-hidden="true">→</span></button><button type="button" id="mech-reset" class="mech-reset" aria-label="Reset mechanism simulation">Reset</button></div>`;
    el('controls').innerHTML=c;
  }
  function query() {
    const wide=values.scope==='finance', s=stage, n=wide?18:11;
    const labels=['Authenticate and resolve the Operations scope. No data has entered model context.','Search both allowed indexes. The Finance-only document is '+(wide?'visible under the additional Finance grant.':'excluded before candidate generation.'),'Fuse ranked lists'+(values.rerank?' and rerank the authorized shortlist.':' without a second-stage reranker.')+' Relevance does not modify permissions.','Generate from '+(wide?'4':'3')+' verified source chunks. The answer carries chunk IDs and source versions.'];
    let b=text(32,35,'SCOPED RETRIEVAL / TWO SEARCH PATHS','mech-label');
    b+=edge('M186 186H215',s>0?'active':'')+edge('M355 186H369V108H392',s>0?'active':'')+edge('M355 186H369V264H392',s>0?'active':'')+edge('M540 108H563V186H582',s>1?'active':'')+edge('M540 264H563V186H582',s>1?'active':'')+edge('M711 186H741',s>2?'active':'');
    b+=box(31,148,155,76,'User question','“Q4 supplier risk?”',s===0?'active':'');
    b+=box(215,148,140,76,'Scope filter',wide?'OPS + FIN':'OPS only',s===0?'active':'');
    b+=box(392,70,148,76,'Lexical / BM25','exact terms + IDs',s===1?'active':'');
    b+=box(392,226,148,76,'Vector retrieval','semantic neighbors',s===1?'active':'');
    b+=box(582,148,129,76,'Rank fusion',values.rerank?'RRF → rerank':'RRF only',s===2?'active':'');
    b+=box(741,148,130,76,'Cited answer',s===3?'sources attached':'await evidence',s===3?'active':'');
    b+=text(394,177,`A17 · B02 · ${wide?'F09':'C11'}`,'mech-mono')+text(394,331,`B02 · C11 · ${wide?'F09':'A17'}`,'mech-mono');
    b+=`<rect x="216" y="356" width="655" height="31" rx="4" fill="${wide?'#153739':'#302921'}"/>`+text(230,377,wide?'F09 / Finance report · extra grant checked · source version 7':'F09 / Finance report · excluded by source ACL · never sent to model','mech-small');
    return {diagram:svg(b,'Question passes access control, branches to lexical and vector search, rejoins at rank fusion, and becomes a cited answer.'),state:labels[s],metrics:[[n,'authorized candidates'],[values.rerank?'ON':'OFF','second-stage reranker'],[s===3?(wide?'4':'3'):'0','chunks in model context'],['0','unauthorized chunks']]};
  }
  function collaboration() {
    const viewer=values.role==='viewer',ver=stage===0?12:stage===3&&!viewer?14:13;
    const labels=['Alice and Bob read shared artifact v12. Their session histories remain private.','Alice submits expected_version=12. The atomic compare-and-update succeeds: artifact v13.','Bob submits expected_version=12. '+(viewer?'Role check rejects the write with 403 before any mutation.':'The stored version is now 13: return 409 Conflict and the latest version.'),viewer?'Bob receives an authorized read update of v13. His viewer role cannot be elevated by rebasing.':'Bob reloads v13, rebases a non-overlapping edit, and commits expected_version=13. Subscribers receive v14.'];
    let b=text(32,35,'CONCURRENCY CONTROL / COMPARE → COMMIT → BROADCAST','mech-label');
    b+=box(39,78,202,91,'Alice · editor','local snapshot v12',stage===1?'active':'');
    b+=box(659,78,202,91,`Bob · ${values.role}`,stage===3&&!viewer?'rebase onto v13':'local snapshot v12',stage===2?'warn':stage===3&&!viewer?'active':'');
    b+=box(343,113,214,97,'Shared artifact',`server version = ${ver}`,stage===1||stage===3?'active':'');
    b+=edge('M241 123H285V142H343',stage===1?'active':'')+edge('M659 123H610V142H557',stage===2?'warn':stage===3?'active':'');
    b+=text(262,96,'PATCH / v12','mech-mono')+text(567,96,stage===3&&!viewer?'PATCH / v13':'PATCH / v12','mech-mono');
    b+=text(35,208,'Private context A','mech-small')+text(673,208,'Private context B','mech-small');
    b+=edge('M450 210V247H140V267',stage>=1?'active':'')+edge('M450 247H758V267',stage===3?'active':'')+edge('M450 247V267',stage===2?'warn':'');
    b+=box(39,267,202,72,'1 · Alice commits',stage>=1?'accepted → v13':'pending',stage>=1?'active':'');
    b+=box(349,267,202,72,viewer?'2 · Permission check':'2 · Bob conflicts',stage>=2?(viewer?'403 · read only':'409 · stale version'):'pending',stage>=2?'warn':'');
    b+=box(659,267,202,72,'3 · Rebase / refresh',stage===3?(viewer?'read update v13':'accepted → v14'):'pending',stage===3?'active':'');
    b+=tag(40,380,'Versioned artifact events only')+tag(440,380,'Membership checked on subscription','#83afff');
    return {diagram:svg(b,'Two private sessions submit versioned edits to a shared artifact. Alice succeeds, Bob conflicts or is denied, then rebases or refreshes.'),state:labels[stage],metrics:[[`v${ver}`,'shared artifact version'],[stage>=1?'1':'0','Alice accepted writes'],[stage===3&&!viewer?'1':'0','Bob accepted writes'],[viewer?'READ':'EDIT','Bob capability']]};
  }
  function departments() {
    const allowed=values.approved&&values.purpose==='procurement';
    let b=text(32,35,'FEDERATED DATA PRODUCTS / PURPOSE-BOUND DELEGATION','mech-label');
    const ds=[{x:32,name:'FINANCE',a:'Budget aggregate',sub:'region + quarter',ok:allowed},{x:338,name:'OPERATIONS',a:'Demand forecast',sub:'approved SKU totals',ok:true},{x:644,name:'LEGAL',a:'Clearance status',sub:'boolean + policy ID',ok:true}];
    ds.forEach((d,i)=>{b+=`<rect x="${d.x}" y="59" width="225" height="173" rx="7" fill="#102031" stroke="#32495f"/>`+text(d.x+16,86,d.name,'mech-label')+box(d.x+15,102,195,68,d.a,d.sub,d.ok?'active':'warn')+text(d.x+16,205,i===0?'Raw ledger stays local':i===1?'Supplier PII stays local':'Legal memo stays local','mech-small');b+=edge(`M${d.x+112} 232V260H450V279`,d.ok&&stage>0?'active':d.ok?'':'warn');});
    b+=box(216,279,468,67,'Purpose + recipient + policy check',`requested purpose: ${values.purpose}`,stage>0?(allowed?'active':'warn'):'');
    b+=edge('M450 346V374',stage===2&&allowed?'active':'');
    b+=box(300,374,300,52,stage===2?(allowed?'Publish governed analysis':'Hold · required input unavailable'):'Await governed join','',stage===2?(allowed?'active':'warn'):'');
    const labels=['Resolve source-specific capabilities. Finance approval is '+(values.approved?'present for procurement only.':'not yet present.'),'Evaluate the requested purpose at every data product. '+(allowed?'All three contracts permit this procurement join.':'Finance denies this join; the runtime must hold, narrow the scope, or seek the missing approval.'),allowed?'Join approved aggregates. Publish only to authorized recipients with all three provenance records.':'No complete result is published. Neither shared workspace membership nor another department’s permission bypasses Finance policy.'];
    return {diagram:svg(b,'Three departmental data products feed a purpose and recipient policy gate before a governed result is published.',450),state:labels[stage],metrics:[[allowed?'3 / 3':'2 / 3','source grants'],['3','local data boundaries'],[stage===2&&allowed?'3':'0','published provenance refs'],[allowed?'PASS':'HOLD','join policy']]};
  }
  function resilience() {
    const denied=values.fault==='denied',timeout=values.fault==='timeout';
    const labels=denied?['Resolve actor, action, resource, and policy version.','Authorization denies the requested write. Emit an auditable denial.','Execution remains blocked. No tool credential is issued.','Retry remains blocked: permission errors are not transient failures.','Return a structured denial. A human may request a separately approved workflow.']:timeout?['Resolve identity and authorize the exact effect.','Checkpoint the plan and persist effect intent with key eff_42.','The provider commits, but the connection times out before its response arrives. Outcome is unknown to the runtime.','Query provider status using eff_42. Reconcile the existing receipt; do not issue a second business effect.','Commit the receipt to the checkpoint and resume downstream work.']:['Resolve identity and authorize the exact effect.','Checkpoint the plan and persist effect intent with key eff_42.','Provider reports a temporary failure before committing. Preserve the intent and retry budget.','Retry with the same idempotency key after bounded backoff; the provider now returns a receipt.','Commit the receipt and publish a completed event.'];
    const nodes=[['Verify','actor + scope'],['Checkpoint','effect intent'],['Execute','key: eff_42'],[timeout?'Reconcile':'Retry',timeout?'lookup receipt':'same key + backoff'],['Commit','persist outcome']];
    let b=text(32,35,'DURABLE EFFECT / FAILURE IS A STATE TRANSITION','mech-label');
    nodes.forEach((n,i)=>{const x=31+i*173;if(i)b+=edge(`M${x-29} 152H${x}`,denied?'muted':stage>=i?'active':'');b+=box(x,110,144,84,n[0],n[1],denied?(i===0?'warn':''):stage===i?(i===2?'warn':'active'):'');});
    b+=edge('M448 194V262H275V194',!denied&&stage>=2?'warn':'muted');
    b+=text(302,248,'resume from durable state','mech-small');
    b+=box(32,303,251,70,denied?'Policy decision: DENY':'Durable checkpoint',denied?'no execution capability':'plan + version + effect intent',denied?'warn':'blue');
    b+=box(324,303,251,70,'External provider',denied?'not invoked':stage>=2?(timeout?'receipt exists for eff_42':stage>=3?'receipt exists for eff_42':'temporary failure'):'awaiting invocation',!denied&&stage>=2?'active':'');
    b+=box(616,303,251,70,'Recovery budget',denied?'retry prohibited':'deadline · attempts ≤ 3',denied?'warn':'');
    return {diagram:svg(b,'Five-stage state machine verifies authority, checkpoints, executes an effect, reconciles or retries, and commits its receipt.'),state:labels[stage],metrics:[[denied?'DENY':'ALLOW','policy decision'],[denied?'0':stage>=2?(timeout?'1':stage>=3?'1':'0'):'0','provider business effects'],['eff_42','stable effect key'],[denied?'0':stage>=3&&!timeout?'1':'0','retries attempted']]};
  }
  function threads() {
    const w=Number(values.workers),starts=[0,Math.floor(1/w)*2,Math.floor(2/w)*2],join=Math.max(...starts)+2,t=Math.min(stage,join+1);
    let b=text(32,35,'REQUEST DAG → BOUNDED WORKER SCHEDULE','mech-label');
    const names=['Document search','Warehouse query','Policy lookup'];
    for(let tick=0;tick<=7;tick++){const x=227+tick*83;b+=edge(`M${x} 88V322`,'muted',false)+text(x,74,`${tick}`,'mech-mono','middle');}
    b+=text(755,52,'logical time','mech-mono');
    names.forEach((n,i)=>{const y=102+i*63,done=t>=starts[i]+2,running=t>=starts[i]&&!done;b+=text(32,y+28,n)+text(32,y+47,`task_${i+1} · slot ${i%w+1}`,'mech-mono');b+=`<rect x="${227+starts[i]*83}" y="${y}" width="166" height="44" rx="4" class="mech-node ${done?'mech-node-active':running?'mech-node-blue':''}"/>`+text(310+starts[i]*83,y+28,done?'result ready':running?'running':'queued','','middle');});
    const jx=227+join*83;b+=text(32,319,'Join → commit')+box(jx,282,83,44,t>join?'saved':t===join?'join':'wait','',t>=join?'active':'');
    b+=`<path d="M${227+t*83} 87V333" stroke="#f0bc70" stroke-width="2"/>`+text(227+t*83,359,`t=${t}`,'mech-label','middle');
    b+=tag(32,388,`${w} concurrent slot${w>1?'s':''}`)+tag(330,388,'Immutable branch outputs','#83afff')+tag(649,388,'One state writer','#f0bc70');
    const running=starts.filter(s=>t>=s&&t<s+2).length,done=starts.filter(s=>t>=s+2).length;
    return {diagram:svg(b,'A Gantt chart schedules three independent two-tick reads into the selected worker budget, followed by one join and commit.'),state:t>join?`All three reads have joined. One versioned commit completes in ${join+1} illustrative ticks.`:`At t=${t}, ${running} task${running===1?' is':'s are'} running and ${done} result${done===1?' is':'s are'} ready. The join ${done===3?'can now execute.':'waits for every required result.'}`,metrics:[[w,'worker-slot budget'],[running,'currently running'],[`${done} / 3`,'required results ready'],[`${join+1} ticks`,'scheduled completion']]};
  }
  function kv() {
    const prefix=values.prefix,reused=prefix==='same'?8:prefix==='edited'?2:0,tokens=8+stage,cacheTokens=tokens;
    let b=text(32,35,'PER-LAYER ATTENTION STATE / TWO-TOKEN BLOCKS FOR ILLUSTRATION','mech-label');
    b+=text(32,86,'PROMPT','mech-mono')+text(32,150,'K · keys','mech-mono')+text(32,198,'V · values','mech-mono');
    const size=51,dx=58,x0=145;
    for(let i=0;i<12;i++){
      const filled=i<tokens,isReuse=i<reused,isNew=i>=8;
      b+=text(x0+i*dx+size/2,86,i<8?`p${i+1}`:`d${i-7}`,'mech-small','middle');
      [118,168].forEach((y,idx)=>{b+=`<rect x="${x0+i*dx}" y="${y}" width="${size}" height="36" rx="4" fill="${filled?(isReuse?'#17453f':isNew?'#23395e':'#26333e'):'#111e2c'}" stroke="${filled?(isReuse?'#64ddcc':isNew?'#83afff':'#688098'):'#33475b'}"${filled?'':' stroke-dasharray="3 4"'}/>`+text(x0+i*dx+size/2,y+23,filled?`${idx?'V':'K'}${i+1}`:'·','mech-small','middle');});
      if(i%2===0&&i<8)b+=edge(`M${x0+i*dx} 211V222H${x0+(i+1)*dx+size}V211`,isReuse?'active':'muted',false);
    }
    b+=text(145,246,reused?`${reused} matching prefix tokens reuse stored K/V`:'No reusable blocks: compute all prompt K/V','mech-small');
    b+=box(31,289,190,74,'Project Qₜ, Kₜ, Vₜ','current input token','blue')+box(308,289,310,74,'Append Kₜ / Vₜ → attend','softmax(qₜKᵀ / √d) V','active')+box(700,289,170,74,'Predict next token','sample from logits','blue');
    b+=edge('M221 326H308','active')+edge('M618 326H700','active')+edge('M459 222V289','active');
    const note=prefix==='tenant'?'A different tenant changes the isolation namespace: identical text yields no cache reuse.':prefix==='edited'?'Editing token 4 invalidates its block and every downstream block; only the first full two-token block is reused.':prefix==='same'?'The permitted eight-token prefix is reused; only the new suffix needs prefill computation.':'Cold start: prefill computes eight prompt tokens before decoding can append new state.';
    return {diagram:svg(b,'Token columns show separate keys and values, reused prefix blocks, newly appended decode tokens, and attention over history including the current token before predicting the next.'),state:`${note} ${stage?`${stage} decode token${stage>1?'s':''} appended; attention now reads ${cacheTokens} token positions.`:'Step to append decode tokens.'}`,metrics:[[reused,'prompt tokens reused'],[8-reused,'prompt tokens to prefill'],[cacheTokens,'K/V positions per layer'],[`${(2*32*8*128*2*cacheTokens/1024).toFixed(0)} KiB`,'example KV memory¹']]};
  }
  function scheduling() {
    const load=Number(values.load),local=values.locality,workers=[{name:'A',x:32,load,wait:Math.round(load/100*100),hit:local?80:0,mem:load>85?92:68},{name:'B',x:338,load:30,wait:30,hit:local?30:0,mem:51},{name:'C',x:644,load:20,wait:20,hit:0,mem:36}];
    workers.forEach(w=>{w.score=w.wait+Math.round(60*(1-w.hit/100));w.admit=w.mem+12<=95;});
    const best=workers.filter(w=>w.admit).reduce((a,b)=>a.score<=b.score?a:b);
    let b=text(32,35,'FAIR ADMISSION → COST ESTIMATE → DISPATCH','mech-label');
    b+=box(32,67,225,72,'Tenant queues','A: ▪ ▪ ▪   B: ▪ ▪   C: ▪','blue')+box(338,67,225,72,'Admission control','quota + 12% KV reservation','active')+box(644,67,225,72,'Route by estimate',`selected worker: ${best.name}`,'active');
    b+=edge('M257 103H338','active')+edge('M563 103H644','active');
    workers.forEach(w=>{const selected=w===best;b+=edge(`M756 139V175H${w.x+112}V205`,selected?'active':'muted');b+=`<rect x="${w.x}" y="205" width="225" height="167" rx="7" class="mech-node ${selected?'mech-node-active':!w.admit?'mech-node-warn':''}"/>`+text(w.x+17,234,`WORKER ${w.name}`,selected?'mech-label':'mech-mono')+text(w.x+17,261,`Queue estimate   ${w.wait} ms`,'mech-small')+text(w.x+17,285,`Prefix reusable   ${w.hit}%`,'mech-small')+text(w.x+17,309,`KV used   ${w.mem}%`,'mech-small');b+=`<rect x="${w.x+17}" y="322" width="191" height="6" rx="3" fill="#26384a"/><rect x="${w.x+17}" y="322" width="${191*w.mem/100}" height="6" rx="3" fill="${w.admit?'#83afff':'#f0bc70'}"/>`+text(w.x+17,354,w.admit?`Estimated start   ${w.score} ms`:'Not admitted · KV reserve','mech-small');});
    const state=`Request ${stage+1} routes to ${best.name}: ${best.wait} ms queue + ${60-Math.round(60*best.hit/100)} ms uncached prefill = ${best.score} ms estimated start. ${load>85?'A fails the memory-reservation check.':best.name==='A'?'The warm prefix saves enough work to outweigh A’s queue.':'Waiting for A’s warmer prefix would cost more than using another eligible worker.'} Values are illustrative, not a benchmark.`;
    return {diagram:svg(b,'Three worker cards compare queue delay, reusable prefix, and memory occupancy, with the lowest-cost eligible worker selected.'),state,metrics:[[best.name,'selected worker'],[`${best.score} ms`,'estimated time to decode'],[workers.filter(w=>w.admit).length,'memory-eligible workers'],[stage+1,'illustrative request number']]};
  }
  function operators() {
    const asc=values.target==='ascend',op=values.operator;
    const specs={matmul:{name:'Matmul',formula:'C = A × B',shape:'M × K · K × N',lower:'layout + dtype checks',tile:'tile M / N / K',kernel:asc?'Cube Matmul API':'CPU GEMM / BLAS',check:'relative error + throughput'},rmsnorm:{name:'RMSNorm',formula:'y = x · rsqrt(mean(x²) + ε) · w',shape:'reduce last dimension',lower:'reduction + broadcast',tile:'split rows / reduce',kernel:asc?'Vector reduction + scale':'CPU vector operations',check:'epsilon + reduction error'},rope:{name:'RoPE',formula:'[x₀c − x₁s, x₀s + x₁c]',shape:'paired head dimensions',lower:'position + layout checks',tile:'batch × heads × seq',kernel:asc?'Vector rotate kernel':'CPU reference rotation',check:'position offsets + error'}};
    const p=specs[op];
    let b=text(32,35,'GRAPH SEMANTICS → TARGET-SPECIFIC EXECUTION','mech-label');
    const ns=[['Frontend graph',p.name],['Legalize / lower',p.lower],['Fuse / tile',p.tile],['Device kernel',p.kernel],['Validate','reference comparison']];
    ns.forEach((n,i)=>{let x=31+i*173;if(i)b+=edge(`M${x-20} 136H${x}`,stage>=i?'active':'');b+=box(x,94,153,84,n[0],n[1],stage===i?'active':'');});
    b+=`<rect x="32" y="219" width="425" height="147" rx="7" class="mech-node mech-node-blue"/>`+text(50,247,`${p.name.toUpperCase()} / SEMANTIC CONTRACT`,'mech-label')+text(50,280,p.formula)+text(50,311,p.shape,'mech-small')+text(50,340,'Compare identical inputs, shapes, and positions.','mech-small');
    b+=`<rect x="481" y="219" width="388" height="147" rx="7" class="mech-node ${stage===4?'mech-node-active':''}"/>`+text(499,247,asc?'ASCEND ADAPTER / CANN':'PORTABLE CPU REFERENCE','mech-label')+text(499,280,asc?'Host tiling → data movement → kernel':'Framework graph → supported CPU kernels')+text(499,311,'Acceptance: '+p.check,'mech-small')+text(499,340,asc?'Verify precision support on the exact device.':'Use as a semantic baseline, not an NPU emulator.','mech-small');
    const labels=[`Capture ${p.name} in a typed graph. Preserve shape, dtype, and the mathematical contract.`,`Legalize ${p.name}: ${p.lower}. Unsupported combinations require an explicit fallback or rejection.`,`Choose ${p.tile}. ${asc?'Fusion and local-memory tiling depend on the Ascend device and compiler capabilities.':'The CPU path follows the reference backend’s vectorization and library strategy.'}`,`Dispatch ${p.kernel}. Track host/device transfers and workspace usage; an operator API alone is not a performance guarantee.`,`Validate ${p.check}. Only promote the adapter after numerical, task-quality, and latency acceptance checks pass.`];
    return {diagram:svg(b,'A five-stage compiler pipeline transforms a selected model operator into target kernels and validates them against a reference.'),state:labels[stage],metrics:[[asc?'NPU':'CPU','selected execution target'],[p.name,'operator contract'],[`${stage+1} / 5`,'pipeline phase'],[stage===4?'REQUIRED':'PENDING','quality acceptance']]};
  }
  const renders={query,collaboration,departments,resilience,threads,kv,scheduling,operators};
  function render() {
    const data=renders[active]();
    el('diagram').innerHTML=data.diagram;
    el('state-text').textContent=data.state;
    el('metrics').innerHTML=data.metrics.map(([value,label])=>`<div class="mech-metric"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('');
    el('step-count').textContent=`${stage+1} / ${stepCount()}`;
    el('next').innerHTML=`${stage===stepCount()-1?'Replay':active==='kv'?'Decode token':active==='scheduling'?'Route request':'Next step'} <span aria-hidden="true">${stage===stepCount()-1?'↺':'→'}</span>`;
    if(active==='kv')el('detail').textContent=models.kv.detail+' ¹ Example memory = 2 × 32 layers × 8 KV heads × 128 head dimensions × 2 bytes × cached tokens. Includes K and V only; allocator overhead and other model state are excluded.';
  }
  function activate(id,focus=false) {
    active=id;stage=0;values={...models[id].defaults};
    const m=models[id];
    app.querySelectorAll('[data-mech]').forEach(t=>{const selected=t.dataset.mech===id;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;});
    el('panel').setAttribute('aria-labelledby',`mech-tab-${id}`);
    el('category').textContent=m.category;el('title').textContent=m.title;el('description').textContent=m.description;el('detail').textContent=m.detail;el('invariant').textContent=m.invariant;
    el('sources').innerHTML=m.sources.map(k=>`<a href="${refs[k][1]}" target="_blank" rel="noopener noreferrer">${esc(refs[k][0])} ↗</a>`).join('');
    controls();render();if(focus)document.getElementById(`mech-tab-${id}`).focus();
  }
  app.addEventListener('click',(event)=>{const tab=event.target.closest('[data-mech]');if(tab){activate(tab.dataset.mech);return;}if(event.target.closest('#mech-next')){stage=(stage+1)%stepCount();render();}if(event.target.closest('#mech-reset')){stage=0;render();}});
  app.addEventListener('keydown',(event)=>{const tab=event.target.closest('[data-mech]');if(!tab)return;const ids=Object.keys(models),i=ids.indexOf(active);let next;if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(i+1)%ids.length;if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(i+ids.length-1)%ids.length;if(event.key==='Home')next=0;if(event.key==='End')next=ids.length-1;if(next!==undefined){event.preventDefault();activate(ids[next],true);}});
  app.addEventListener('input',(event)=>{const input=event.target.closest('[data-mech-input]');if(!input)return;const key=input.dataset.mechInput;values[key]=input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value;stage=Math.min(stage,stepCount()-1);const out=el(`output-${key}`);if(out)out.textContent=String(values[key]);render();});
  activate('query');app.hidden=false;
})();

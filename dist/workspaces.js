(() => {
  'use strict';
  const root = document.getElementById('workspaces');
  if (!root) return;
  const el = (id) => document.getElementById(`ws-${id}`);
  const esc = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let route = 'draft';
  let exportStep = 0;
  const t = (x,y,value,cls='',anchor='start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(value)}</text>`;
  const box = (x,y,w,h,title,sub='',kind='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" class="ws-node${kind ? ` ws-node-${kind}` : ''}"/>${t(x+w/2,y+31,title,'','middle')}${sub?t(x+w/2,y+57,sub,'ws-svg-small','middle'):''}`;
  const path = (d,kind='',arrow=true) => `<path d="${d}" class="ws-edge${kind?` ws-edge-${kind}`:''}"${arrow?' marker-end="url(#ws-arrow)"':''}/>`;
  function svg(body,alt,height=450) {
    return `<svg viewBox="0 0 1000 ${height}" role="img" aria-label="${esc(alt)}"><defs><marker id="ws-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 9 5 1 9" fill="none" stroke="#9bbccc" stroke-width="1.5"/></marker></defs>${body}</svg>`;
  }
  const routeInfo={
    draft:{request:'write_file(path, text)',path:'/plan.md',router:'CompositeBackend',sub:'default route → state',kind:'state',lane:0,status:'The write returns files_update. The graph applies it to this conversation’s state; no /plan.md is created at the host filesystem root.',detail:'Plans, summaries, draft chapters, and the final report live as entries in the graph’s files map. The UI can render or edit those entries through the thread state. Their recovery follows the configured checkpointer.',reason:'Working notes stay associated with a conversation and can be restored with its state. This is not an OS directory and not a claim that the content is kept only in volatile RAM.'},
    upload:{request:'pdf_reader(path)',path:'/workspace/input.pdf',router:'Workspace resolver',sub:'department → thread → path',kind:'disk',lane:1,status:'The PDF tool resolves the authorized thread’s physical file, then reads or creates its text sidecar. The original upload remains on disk.',detail:'Generic file tools use the composite /workspace route. Specialized PDF, audio, and table tools resolve the same namespace to concrete paths for native parsers and approved subprocesses. Path containment and thread selection happen before file access.',reason:'PDF bytes, spreadsheet data, and audio are real file inputs. Native tools need OS-visible paths; a key in the graph’s files map is not automatically mounted into their filesystem.'},
    knowledge:{request:'edit_file(path, patch)',path:'/knowledge/policy.md',router:'CompositeBackend',sub:'knowledge route → read-only',kind:'knowledge',lane:2,status:'The knowledge wrapper rejects this edit. Zero source bytes change; the agent must use the separate maintenance workflow to request a source update.',detail:'The curated knowledge route wraps a physical filesystem with explicit write, edit, and upload denials. Read operations still return approved source content. Read-only access is enforced by this wrapper, not inferred from the directory name.',reason:'A generated answer should not rewrite the evidence used to justify it. Curated source updates and task-local drafts have separate owners and update lifecycles.'}
  };
  function renderRouting() {
    const r=routeInfo[route];
    let b=t(31,32,'VIRTUAL NAMESPACE / DIFFERENT STORAGE SEMANTICS','ws-svg-overline');
    b+=box(30,194,207,98,r.request,r.path,r.kind);
    b+=path('M237 243H290','active');
    b+=box(290,194,223,98,r.router,r.sub,r.kind);
    const ys=[69,196,323],colors=['active','blue','warn'];
    ys.forEach((y,i)=>{b+=path(`M513 243H548V${y+42}H587`,r.lane===i?colors[i]:'');});
    b+=box(587,69,380,88,'StateBackend · graph files','/plan.md → thread state → checkpoint',r.lane===0?'state':'');
    b+=box(587,196,380,88,'FilesystemBackend · physical bytes','/workspace/input.pdf → scoped disk path',r.lane===1?'disk':'');
    b+=box(587,323,380,88,'Read-only knowledge backend',r.lane===2?'EDIT DENIED · no source mutation':'/knowledge/policy.md → curated source',r.lane===2?'knowledge':'');
    b+=t(30,337,'Virtual paths are API keys.','ws-svg-small')+t(30,359,'They do not all map to OS files.','ws-svg-small');
    b+=t(588,54,'DEFAULT / CONVERSATION STATE','ws-svg-mono')+t(588,181,'MOUNT / PER-THREAD WORKSPACE','ws-svg-mono')+t(588,308,'MOUNT / CURATED KNOWLEDGE','ws-svg-mono');
    el('diagram').innerHTML=svg(b,'A virtual operation passes through runtime path routing to graph state, thread-scoped disk storage, or read-only knowledge. The selected path is highlighted.');
    el('route-status').textContent=r.status;el('route-detail').textContent=r.detail;el('route-reason').textContent=r.reason;el('next').hidden=true;
  }
  function renderExport() {
    const labels=[['State-backed file','/final_report.md'],['UI export request','text + PDF format'],['Temporary input','write input.md'],['Pandoc adapter','read → convert → bytes'],['Browser download','report.pdf bytes']];
    let b=t(31,33,'CONTROLLED BRIDGE / GRAPH TEXT → OS FILE → DOWNLOAD','ws-svg-overline');
    labels.forEach((n,i)=>{const x=27+i*194;if(i)b+=path(`M${x-24} 166H${x}`,exportStep>=i?'active':'');b+=box(x,123,170,89,n[0],n[1],exportStep===i?(i===2||i===3?'disk':'state'):'');b+=t(x+85,104,`0${i+1}`,'ws-svg-mono','middle');});
    b+=`<rect x="399" y="93" width="381" height="148" rx="11" fill="none" stroke="#83afff" stroke-dasharray="5 5"/>`+t(589,265,'SERVER-OWNED TEMPORARY DIRECTORY','ws-svg-mono','middle');
    b+=path('M589 241V313',exportStep===5?'active':'');
    b+=box(400,313,376,73,'Finally: remove temporary files','Source graph artifact remains in the thread.',exportStep===5?'state':'');
    b+=t(32,325,'A CLI opens OS-visible paths.','ws-svg-small')+t(32,348,'It cannot open a graph-state key','ws-svg-small')+t(32,371,'without an explicit adapter.','ws-svg-small');
    const statuses=[
      '1 / 6 · The report exists in graph state. Its virtual path is not a physical file that Pandoc can open.',
      '2 / 6 · The UI sends the selected report content and export format to the server export endpoint.',
      '3 / 6 · The adapter creates a temporary directory and writes the received text to input.md on disk.',
      '4 / 6 · The server invokes Pandoc with controlled arguments, waits for conversion, and reads the output bytes.',
      '5 / 6 · The endpoint returns those bytes with download headers. The browser receives a PDF artifact.',
      '6 / 6 · The adapter removes temporary conversion files in its finally path. This does not delete the state-backed report.'
    ];
    el('diagram').innerHTML=svg(b,'Six export steps materialize a state-backed report into a temporary OS file, run Pandoc, return browser download bytes, and clean up temporary files.',418);
    el('route-status').textContent=statuses[exportStep];
    el('route-detail').textContent='This is a server-controlled conversion path present in the examined implementation. State text is explicitly materialized into a temporary file because the converter consumes filesystem paths. Its output is read into response bytes; the temporary directory is cleaned up afterward.';
    el('route-reason').textContent='The agent has no arbitrary execute tool in this configuration. A curated adapter can call an OS program without handing the model a shell. Its process permissions and input validation remain separate controls.';
    el('next').hidden=false;el('next').innerHTML=`${exportStep===5?'Replay export':'Next export step'} <span aria-hidden="true">${exportStep===5?'↺':'→'}</span>`;
  }
  function setRoute(id) {
    route=id;exportStep=0;
    root.querySelectorAll('[data-ws-route]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.wsRoute===route)));
    if(route==='export')renderExport();else renderRouting();
  }
  const lifecycle={
    continue:{state:['SAME THREAD','The next step reads the latest state.'],disk:['SAME THREAD','The next tool reads the same stored bytes.'],knowledge:['SOURCE CONTROLLED','Read the approved source version.'],note:'A single virtual file API sits over independent stores. A graph checkpoint and a disk write are not automatically one atomic transaction.'},
    new:{state:['DIFFERENT THREAD','Start with separate state; prior drafts are not inherited.'],disk:['DIFFERENT THREAD','Resolve a new thread directory; old uploads stay with the old thread.'],knowledge:['AUTHORIZED SOURCE','Read the same curated mount only when this context permits it.'],note:'A new thread changes the state and upload namespace. It does not implicitly copy the old conversation’s drafts or grant access to another thread’s files.'},
    restart:{state:['CHECKPOINTER DEPENDENT','Reload a stored checkpoint if persistence was enabled and retained.'],disk:['VOLUME DEPENDENT','Files remain if the underlying directory or mounted volume survives.'],knowledge:['MOUNT DEPENDENT','Reconnect the retained curated source before reading it.'],note:'The examined dev runtime periodically flushes local checkpoint files; it is not RAM-only. The newest unflushed state can still be lost in a crash. This does not establish replicated production durability.'},
    expiry:{state:['SEPARATE RETENTION','A conversation checkpoint may still contain its drafts and file references.'],disk:['EXPLICIT POSITIVE TTL','An expired upload directory may be removed and recreated empty.'],knowledge:['SEPARATE LIFECYCLE','Curated knowledge is not deleted by the upload-workspace TTL.'],note:'Automatic upload expiry is disabled by default in the examined implementation. This scenario requires a positive TTL. A surviving citation or checkpoint does not guarantee its original uploaded file still exists.'}
  };
  function updateLifecycle() {
    const data=lifecycle[el('event').value];
    for(const key of ['state','disk','knowledge']){el(`${key}-label`).textContent=data[key][0];el(`${key}-survival`).textContent=data[key][1];}
    el('lifecycle-note').textContent=data.note;
  }
  const software={
    container:{status:'OBSERVED PACKAGE',nodes:[['SERVICE','Python + Node','graph service + web UI'],['DEPENDENCIES','Native libraries','parsers + Pandoc + ffmpeg'],['PACKAGE','Ubuntu / OCI','Docker + Podman definitions'],['MACHINE','Matching Linux host','CPU architecture + kernel']],detail:'The examined application uses Python and Node with native libraries and external document/media tools. Its container definition starts from Ubuntu; runtime and logs have named-volume configuration. Declared package platforms include x86 Linux and Windows, not a verified universal architecture build.',check:'Native wheels and binaries · kernel/CPU compatibility · service startup · retained runtime volume · export and media tools',result:'The observed software package is an Ubuntu-based application environment. An HTTP model endpoint keeps model-serving implementation separate; the package alone does not prove accelerator compatibility.'},
    kubernetes:{status:'DESIGN TARGET',nodes:[['SERVICE','Container workloads','UI + departmental runtimes'],['MANIFESTS','Deployment contracts','config + identity + probes'],['STORAGE','Persistent volumes','checkpoint + upload lifetimes'],['CLUSTER','Node + device policy','placement + driver integration']],detail:'A Kubernetes deployment is a target architecture here, not a manifest verified in the examined application. Partition the services, declare resource requests and health probes, and design persistent-volume ownership for checkpoints and uploads. Stateful process behavior must be considered before adding replicas.',check:'Manifests · identity and secrets · volume ownership · concurrency behavior · restart/recovery · node/device scheduling',result:'Kubernetes can place and supervise the application, but requires a separately validated deployment and storage design. It does not translate CPU instructions or replace an accelerator runtime.'},
    musl:{status:'DESIGN TARGET / NATIVE COMPONENT',nodes:[['COMPONENT','Suitable native helper','C / Rust-style executable'],['TOOLCHAIN','Target architecture','build for an explicit CPU ABI'],['LINKAGE','musl static build','verify all linked dependencies'],['HOST','Compatible Linux target','syscalls + files + credentials']],detail:'A small native helper may be built against musl and statically linked where its full dependency graph supports it. This is a proposed packaging option for an appropriate component. The examined Python, Node, Pandoc, media, and model-serving stack is not converted into one static binary by selecting musl.',check:'Target CPU/ABI · static-link eligibility · native dependencies · Linux syscall support · functional tests on the intended host',result:'musl changes a native component’s C-library and linking contract. It does not translate x86 code to ARM, package every Python extension, or make accelerator drivers portable.'}
  };
  const model={
    endpoint:{status:'OBSERVED API BOUNDARY',nodes:[['REQUEST','Model client','messages + tool schemas'],['INTERFACE','Compatible HTTP API','configured model endpoint'],['SERVING','External model runtime','backend outside this service'],['DEVICE','Backend responsibility','hardware support unverified']],detail:'The examined agent configures compatible HTTP model clients. Model execution happens behind that endpoint. The application code does not establish which operator kernels, accelerator drivers, or device generations are supported by the serving backend.',check:'API schema · tool-call behavior · streaming · error handling · chosen model/backend quality and performance'},
    ascend:{status:'DESIGN TARGET / VERIFY ON DEVICE',nodes:[['MODEL','Graph + operators','Matmul · RMSNorm · RoPE'],['LOWERING','Supported framework','dtype + layout + fusion'],['RUNTIME','CANN / Ascend C','tiling + device kernels'],['ACCELERATOR','Driver + firmware','specific Ascend generation']],detail:'An Ascend target needs compatible model operators, framework integration, CANN, drivers, firmware, and hardware. Lowering and tiling must preserve operator semantics. Test numerical error and task quality, then measure prefill, decode, memory, and throughput on the exact stack.',check:'Operator coverage · dtype/shape support · numerical tolerances · model quality · driver/runtime matrix · measured latency'}
  };
  function flow(nodes){return nodes.map(([label,title,detail])=>`<div class="ws-compat-node"><span>${esc(label)}</span><strong>${esc(title)}</strong><small>${esc(detail)}</small></div>`).join('');}
  function updateCompatibility() {
    const s=software[el('software-target').value],m=model[el('model-target').value];
    el('software-flow').innerHTML=flow(s.nodes);el('model-flow').innerHTML=flow(m.nodes);
    el('software-status').textContent=s.status;el('model-status').textContent=m.status;
    el('software-status').classList.toggle('ws-badge-amber',el('software-target').value!=='container');
    el('model-status').classList.toggle('ws-badge-amber',el('model-target').value==='ascend');
    el('software-detail').textContent=s.detail;el('model-detail').textContent=m.detail;el('software-check').textContent=s.check;el('model-check').textContent=m.check;
    el('compat-result').textContent=s.result+(el('model-target').value==='ascend'?' The selected Ascend path remains a separate design target requiring hardware validation.':'');
  }
  root.addEventListener('click',event=>{const button=event.target.closest('[data-ws-route]');if(button)setRoute(button.dataset.wsRoute);if(event.target.closest('#ws-next')){exportStep=(exportStep+1)%6;renderExport();}});
  el('event').addEventListener('change',updateLifecycle);
  el('software-target').addEventListener('change',updateCompatibility);el('model-target').addEventListener('change',updateCompatibility);
  setRoute('draft');updateLifecycle();updateCompatibility();
})();

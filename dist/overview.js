(() => {
  'use strict';
  const lab = document.getElementById('ov-lab');
  if (!lab) return;

  const stops = [
    { key: 'ask', label: 'BROWSER', title: 'You ask a question.', body: 'An employee types a question in the chat. The browser sends it together with the conversation (thread) it belongs to and a random, HttpOnly browser identity cookie.', fail: 'Nothing has left the browser yet; the draft message stays on screen.', href: '#protocol', link: '05 · What crosses the wire' },
    { key: 'access', label: 'PROXY', title: 'Access is checked before any AI runs.', body: 'A proxy checks the request origin, the department credential, the browser identity and that this browser owns the thread. Only then is the request forwarded. Choosing a department in the UI does not, by itself, grant access.', fail: 'The proxy refuses the request. The model never sees it, so no prompt can argue its way past this check.', href: '#access-routing', link: '04 · Access & routing' },
    { key: 'scope', label: 'DEPARTMENT', title: 'The department sets the scope.', body: 'Each registered department maps to its own backend process with its own knowledge folder, upload workspace and history. All departments share the same Agent construction and tool list.', fail: 'Routing is fixed, not load-balanced: the request is never moved to a less busy backend or silently handed to another department. Cross-department work needs an explicit, separately authorized handoff.', href: '#workspaces', link: '03 · Files & storage' },
    { key: 'loop', label: 'MODEL ⇄ TOOLS', title: 'The Agent loop decides, acts and observes.', body: 'The model reads the question, history and tool list, then chooses: call a tool, write a plan, delegate to a specialist, or answer. Each tool result comes back as an observation, and the model decides again — a weak search leads to a refined query.', fail: 'A tool error is just another observation. The model may try different arguments or explain the gap honestly instead of guessing.', href: '#request-lifecycle', link: '01 · The Agent loop' },
    { key: 'store', label: 'STORAGE', title: 'Files land in the right store.', body: 'One file API, three contracts: drafts and reports live in conversation state; uploaded files are real bytes on disk for this thread; curated knowledge is mounted read-only.', fail: 'If the Agent tries to write into curated knowledge, the read-only wrapper rejects it. Approved sources cannot be overwritten by a draft.', href: '#workspaces', link: '03 · Files & storage' },
    { key: 'deliver', label: 'INTERFACE', title: 'The result streams back to the screen.', body: 'The server streams messages and state. The interface turns messages into chat, file state into previews and todos into a task list. You get a cited answer, a downloadable file, or an explicit “no evidence found”.', fail: 'If the connection drops, the SDK can rejoin the run; stopping cancels it by run ID. Exports are separate UI requests.', href: '#cases', link: '02 · Six real use cases' }
  ];

  // Packet route through the map (viewBox units) and the waypoint index where each stop sits.
  const route = [[100, 230], [305, 230], [520, 230], [630, 230], [630, 110], [780, 110], [860, 110], [860, 250], [780, 250], [700, 250], [700, 110], [780, 110], [860, 110], [860, 250], [780, 250], [780, 405], [930, 405], [930, 230], [1065, 230]];
  const anchors = [0, 1, 2, 11, 15, 18];
  const cumulative = [0];
  for (let i = 1; i < route.length; i++) cumulative.push(cumulative[i - 1] + Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]));
  const pointAt = distance => {
    let i = 1;
    while (i < route.length - 1 && cumulative[i] < distance) i++;
    const span = cumulative[i] - cumulative[i - 1] || 1;
    const t = Math.min(1, Math.max(0, (distance - cumulative[i - 1]) / span));
    return [route[i - 1][0] + (route[i][0] - route[i - 1][0]) * t, route[i - 1][1] + (route[i][1] - route[i - 1][1]) * t];
  };

  const $ = id => document.getElementById(id);
  const packet = $('ov-packet');
  const nodes = [...lab.querySelectorAll('[data-ov-stop]')];
  const toolsNode = lab.querySelector('[data-ov-part="3"]');
  const dots = [...lab.querySelectorAll('[data-ov-dot]')];
  const wires = [...lab.querySelectorAll('[data-ov-wire]')];
  const play = $('ov-play');
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0, distance = 0, frame = 0, timer = 0, playing = false;

  function movePacket(target) {
    cancelAnimationFrame(frame);
    const start = distance, end = cumulative[anchors[target]];
    if (reduced() || start === end) { distance = end; const [x, y] = pointAt(end); packet.setAttribute('cx', x); packet.setAttribute('cy', y); return; }
    const duration = Math.min(1600, 450 + Math.abs(end - start) * 0.9), began = performance.now();
    const tick = now => {
      const k = Math.min(1, (now - began) / duration), eased = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      distance = start + (end - start) * eased;
      const [x, y] = pointAt(distance);
      packet.setAttribute('cx', x); packet.setAttribute('cy', y);
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  function show(index, { animate = true } = {}) {
    current = (index + stops.length) % stops.length;
    const stop = stops[current];
    nodes.forEach(node => {
      const n = Number(node.dataset.ovStop);
      node.classList.toggle('is-current', n === current);
      node.classList.toggle('is-visited', n < current);
      node.setAttribute('aria-pressed', String(n === current));
    });
    toolsNode?.classList.toggle('is-current', current === 3);
    wires.forEach(wire => {
      const order = stops.findIndex(s => s.key === wire.dataset.ovWire);
      wire.classList.toggle('is-lit', order <= current && order > 0);
    });
    dots.forEach((dot, n) => n === current ? dot.setAttribute('aria-current', 'step') : dot.removeAttribute('aria-current'));
    $('ov-step-kicker').textContent = `STOP ${String(current + 1).padStart(2, '0')} / 06 · ${stop.label}`;
    $('ov-step-title').textContent = stop.title;
    $('ov-step-body').textContent = stop.body;
    $('ov-step-fail').textContent = stop.fail;
    const link = $('ov-step-link');
    link.href = stop.href;
    link.querySelector('span').textContent = stop.link;
    if (animate) movePacket(current); else { distance = cumulative[anchors[current]]; movePacket(current); }
  }

  function setPlaying(on) {
    playing = on;
    play.setAttribute('aria-pressed', String(on));
    play.textContent = on ? '❚❚ Pause tour' : '▶ Auto-tour';
    clearInterval(timer);
    if (on) timer = setInterval(() => { if (current === stops.length - 1) { distance = 0; show(0); } else show(current + 1); }, 4800);
  }

  const manual = index => { setPlaying(false); show(index); };
  nodes.forEach(node => node.addEventListener('click', () => manual(Number(node.dataset.ovStop))));
  dots.forEach((dot, n) => dot.addEventListener('click', () => manual(n)));
  $('ov-prev').addEventListener('click', () => manual(current - 1));
  $('ov-next').addEventListener('click', () => manual(current + 1));
  play.addEventListener('click', () => setPlaying(!playing));
  lab.addEventListener('keydown', event => {
    if (event.target.closest('a')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); manual(current + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); manual(current - 1); }
  });

  show(0, { animate: false });
  // Start the tour once the map scrolls into view; stop it when it leaves.
  if ('IntersectionObserver' in window && !reduced()) {
    let started = false;
    new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting && !started) { started = true; setPlaying(true); }
      else if (!entry.isIntersecting && playing) setPlaying(false);
    }), { threshold: 0.45 }).observe(lab);
  }
})();

(() => {
  'use strict';
  // Chapter anchors in reading order, with the part each belongs to and a short label.
  const chapters = [
    ['overview', 'overview', '00 · At a glance'],
    ['request-lifecycle', 'behaviour', '01 · Agent loop'],
    ['cases', 'behaviour', '02 · Use cases'],
    ['workspaces', 'built', '03 · Files & storage'],
    ['access-routing', 'built', '04 · Access & routing'],
    ['protocol', 'built', '05 · Wire protocol'],
    ['backend-routes', 'choices', '06 · Backends'],
    ['agent-patterns', 'choices', '07 · Strategies'],
    ['compatibility', 'choices', '08 · Compatibility'],
    ['positioning', 'choices', '09 · Where it fits'],
    ['engineering-reference', 'reference', 'Reference labs']
  ].map(([id, part, label]) => ({ el: document.getElementById(id), id, part, label })).filter(c => c.el);
  const partStarts = { behaviour: ['part-behaviour', 'Part I · How it behaves'], built: ['part-built', 'Part II · How it’s built'], choices: ['part-choices', 'Part III · Design choices'] };

  const progress = document.getElementById('read-progress');
  const index = document.getElementById('chapter-index');
  const toggle = document.getElementById('chapter-index-toggle');
  const list = document.getElementById('chapter-index-list');
  const currentLabel = document.getElementById('chapter-index-current');
  const partLinks = [...document.querySelectorAll('.desktop-nav [data-part]')];
  const chapterLinks = [...document.querySelectorAll('#mobile-nav a, #chapter-index-list a')];
  let active = null;

  function topOf(el) { return el.getBoundingClientRect().top; }

  function update() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;

    const line = innerHeight * 0.3;
    let current = null;
    for (const chapter of chapters) if (topOf(chapter.el) <= line) current = chapter;
    // While a part divider is the latest heading passed, the reader is at the start of that part.
    let part = current ? current.part : null, label = current ? current.label : 'Contents';
    for (const [key, [id, name]] of Object.entries(partStarts)) {
      const divider = document.getElementById(id);
      if (divider && topOf(divider) <= line && (!current || topOf(divider) > topOf(current.el))) { part = key; label = name; current = null; }
    }
    index?.classList.toggle('is-shown', scrollY > innerHeight * 0.6);
    if (current === active && currentLabel?.textContent === label) return;
    active = current;
    if (currentLabel) currentLabel.textContent = label;
    partLinks.forEach(link => link.dataset.part === part ? link.setAttribute('aria-current', 'true') : link.removeAttribute('aria-current'));
    chapterLinks.forEach(link => current && link.getAttribute('href') === `#${current.id}` ? link.setAttribute('aria-current', 'true') : link.removeAttribute('aria-current'));
  }

  let queued = false;
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  document.addEventListener('toggle', schedule, true);
  update();

  // Floating contents menu.
  function setOpen(open) {
    if (!toggle || !list) return;
    toggle.setAttribute('aria-expanded', String(open));
    list.hidden = !open;
  }
  toggle?.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  list?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
  });
  document.addEventListener('click', event => {
    if (toggle?.getAttribute('aria-expanded') === 'true' && !index.contains(event.target)) setOpen(false);
  });

  // "Watch the tour" in the hero scrolls to the overview and starts the video.
  document.querySelectorAll('[data-play-tour]').forEach(link => link.addEventListener('click', event => {
    const video = document.getElementById('ov-video');
    if (!video) return;
    event.preventDefault();
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    video.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
    history.replaceState(null, '', '#overview');
    video.play().catch(() => {});
  }));
})();

(() => {
  'use strict';
  function revealTarget(hash) {
    if (!hash || hash === '#') return;
    let target; try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return; }
    if (!target) return;
    let ancestor = target.parentElement;
    while (ancestor) { if (ancestor.tagName === 'DETAILS') ancestor.open = true; ancestor = ancestor.parentElement; }
    if (target.tagName === 'DETAILS') target.open = true;
  }
  document.addEventListener('click', event => { const link = event.target.closest('a[href^="#"]'); if (link) revealTarget(link.getAttribute('href')); });
  window.addEventListener('hashchange', () => revealTarget(location.hash));
  revealTarget(location.hash);
})();

export function initTheme() {
  const api = window.signalAppearance;
  if (!api) return;
  const control = document.querySelector('#appearance-select');
  const wrapper = document.querySelector('.appearance');
  const note = document.querySelector('#appearance-note');
  let timer, transitionTimer;
  function refresh() {
    const {mode, atmosphere} = api.apply();
    control.value = mode;
    note.textContent = mode === 'auto' ? `Your local time · ${atmosphere} atmosphere` : `${atmosphere === 'day' ? 'Day' : 'Night'} atmosphere selected`;
    document.querySelectorAll('[data-atmosphere-label]').forEach(el => { el.textContent = `${atmosphere === 'day' ? 'Day' : 'Night'} atmosphere`; });
  }
  control.addEventListener('change', () => {
    clearTimeout(transitionTimer);
    document.documentElement.classList.add('is-changing-appearance');
    api.setMode(control.value); refresh();
    transitionTimer = setTimeout(() => document.documentElement.classList.remove('is-changing-appearance'), 320);
  });
  function schedule() {
    clearInterval(timer);
    if (!document.hidden) { refresh(); timer = setInterval(refresh, 60000); }
  }
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('storage', e => { if (e.key === 'signal-appearance' || e.key === null) { api.setMode(e.newValue, false); refresh(); } });
  window.addEventListener('pagehide', () => clearInterval(timer));
  window.addEventListener('pageshow', schedule);
  wrapper.hidden = false;
  schedule();
}

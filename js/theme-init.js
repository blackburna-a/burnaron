/* Small blocking pre-paint script. No network, location lookup or dependencies. */
(() => {
  const key = 'signal-appearance';
  const valid = value => ['auto', 'day', 'night'].includes(value);
  let mode = 'auto';
  try { const saved = localStorage.getItem(key); if (valid(saved)) mode = saved; } catch {}
  function apply() {
    // Date uses the visitor's device clock and timezone, including daylight saving.
    const hour = new Date().getHours();
    const atmosphere = mode === 'auto' ? (hour >= 7 && hour < 19 ? 'day' : 'night') : mode;
    document.documentElement.dataset.appearance = atmosphere;
    document.documentElement.dataset.appearanceMode = mode;
    // Match browser chrome and native controls before the page is painted.
    const themeColor = document.querySelector?.('meta[name="theme-color"]');
    const colorScheme = document.querySelector?.('meta[name="color-scheme"]');
    if (themeColor) themeColor.content = atmosphere === 'day' ? '#e2e2d7' : '#101715';
    if (colorScheme) colorScheme.content = atmosphere === 'day' ? 'light' : 'dark';
    return {mode, atmosphere};
  }
  window.signalAppearance = {
    apply,
    setMode(value, persist = true) {
      if (!valid(value)) value = 'auto';
      mode = value;
      if (persist) { try { localStorage.setItem(key, value); } catch {} }
      return apply();
    }
  };
  apply();
})();

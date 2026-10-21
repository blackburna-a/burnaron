// Every effect rests on a fully visible static state. Canceling restores that state.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
const running = new Map();

export function motionAllowed() {
  return !reduced.matches && !connection?.saveData && !document.hidden;
}

export function animateElement(element, keyframes, options = {}) {
  if (!element?.animate || !element.isConnected || !motionAllowed()) return null;
  const settings = { duration: 480, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both', ...options };
  // Decorative callers cannot accidentally start an unbounded animation.
  if (!Number.isFinite(settings.duration) || settings.duration < 0) settings.duration = 480;
  if (!Number.isFinite(settings.iterations ?? 1)) settings.iterations = 1;
  if (!Number.isFinite(settings.delay ?? 0)) settings.delay = 0;
  const animation = element.animate(keyframes, settings);
  running.set(animation, element);
  const release = () => running.delete(animation);
  animation.addEventListener('cancel', release, { once: true });
  animation.addEventListener('finish', () => {
    release();
    // No filled effects or compositor layers survive the finite sequence.
    animation.cancel();
  }, { once: true });
  return animation;
}

export function cancelMotion(root = document) {
  for (const [animation, element] of running) {
    if (root === element || root.contains(element)) {
      running.delete(animation);
      animation.cancel();
    }
  }
}

function syncMotion() {
  const allowed = motionAllowed();
  document.documentElement.dataset.motion = allowed ? 'enabled' : 'still';
  if (!allowed) cancelMotion();
  document.dispatchEvent(new CustomEvent('signal:motionchange', { detail: { allowed } }));
}
reduced.addEventListener('change', syncMotion);
connection?.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
window.addEventListener('pagehide', () => {
  cancelMotion();
  document.documentElement.dataset.motion = 'still';
});
window.addEventListener('pageshow', syncMotion);
syncMotion();

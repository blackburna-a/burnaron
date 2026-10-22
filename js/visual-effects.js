import { animateElement, cancelMotion, motionAllowed } from './motion.js?v=20261021-controls2';

export function initVisualEffects() {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const hero = document.querySelector('.hero');
  const lifecycle = new AbortController();
  const resetters = [];
  const observers = [];
  const listen = (target, type, callback, options = {}) => target.addEventListener(type, callback, { ...options, signal: lifecycle.signal });
  let heroInView = false, heroEntered = false;

  function enterHero() {
    if (heroEntered || !motionAllowed()) return;
    heroEntered = true;
    hero.querySelectorAll('.hero-content > *').forEach((element, index) => {
      animateElement(element, [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 720, delay: index * 85 });
    });
    animateElement(hero.querySelector('.hero-images'), [
      { opacity: .3, transform: 'scale(1.045) translateY(8px)' },
      { opacity: 1, transform: 'scale(1) translateY(0)' }
    ], { duration: 1500, delay: 160 });
    animateElement(hero.querySelector('.hero-haze'), [
      { opacity: 0, transform: 'translateX(-6%)' },
      { opacity: .75, offset: .45 },
      { opacity: .2, transform: 'translateX(0)' }
    ], { duration: 2800, delay: 240 });
    animateElement(hero.querySelector('.hero-light'), [{ opacity: .1 }, { opacity: .75, offset: .55 }, { opacity: .5 }], { duration: 2400, delay: 400 });
    [hero.querySelector('.hero-caption'), hero.querySelector('.hero-bottom')].forEach((element, index) => {
      animateElement(element, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 550, delay: 520 + index * 80 });
    });
  }

  function scene() {
    hero?.classList.toggle('scene-running', heroInView && motionAllowed());
    if (heroInView && motionAllowed()) enterHero();
    else if (hero) cancelMotion(hero);
  }
  if (hero) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => { heroInView = entry.isIntersecting; scene(); });
      observer.observe(hero);
      observers.push(observer);
    } else {
      heroInView = hero.getBoundingClientRect().bottom > 0;
      scene();
    }
  }

  // Observe complete readable blocks, never their individual letters or words.
  const revealSelectors = '.page-intro > *, .section-heading, .section-intro, .project-card, .timeline > li, .case-link, .about-grid > div, .contact-section > .eyebrow, .contact-grid > *, .project-detail-title, .project-detail-grid > *, .portfolio-project > *, .three-principles > *, .case-takeaway, .page-next, .utility-page > *, .cv-text-page > h2';
  const candidates = [...document.querySelectorAll(revealSelectors)].filter(element => !element.closest('[data-case-player]'));
  if ('IntersectionObserver' in window) {
    const seen = new WeakSet();
    const revealing = new Set();
    const observer = new IntersectionObserver(entries => {
      let stagger = 0;
      for (const entry of entries) {
        const element = entry.target;
        if (!entry.isIntersecting) {
          if (revealing.has(element)) cancelMotion(element);
          continue;
        }
        if (seen.has(element)) continue;
        seen.add(element);
        const animation = animateElement(element, [
          { opacity: 0, transform: 'translateY(18px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 640, delay: Math.min(stagger++ * 65, 195) });
        if (!animation) { observer.unobserve(element); continue; }
        revealing.add(element);
        const finish = () => { revealing.delete(element); observer.unobserve(element); };
        animation.addEventListener('finish', finish, { once: true });
        animation.addEventListener('cancel', finish, { once: true });
      }
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    candidates.forEach(element => observer.observe(element));
    observers.push(observer);
  }

  const pointerResets = new Map();
  const pointerObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if (!entry.isIntersecting) pointerResets.get(entry.target)?.(); });
  }) : null;
  if (pointerObserver) observers.push(pointerObserver);

  function track(element, magnetic = false) {
    let frame = 0, rect = null, lastTime = 0;
    let x = 0, y = 0, targetX = 0, targetY = 0;
    const art = element === hero ? hero.querySelector('.hero-art') : null;
    const properties = ['--tilt-x', '--tilt-y', '--magnet-x', '--magnet-y', '--light-x', '--light-y'];
    function reset() {
      cancelAnimationFrame(frame);
      frame = 0; rect = null; lastTime = 0;
      x = y = targetX = targetY = 0;
      element.classList.remove('is-pointed');
      properties.forEach(key => element.style.removeProperty(key));
      art?.style.removeProperty('--scene-x');
      art?.style.removeProperty('--scene-y');
    }
    function draw(time) {
      frame = 0;
      if (!rect || !motionAllowed() || !fine.matches) { reset(); return; }
      const delta = lastTime ? Math.min(time - lastTime, 64) : 16;
      lastTime = time;
      const response = 1 - Math.exp(-delta / 42);
      x += (targetX - x) * response;
      y += (targetY - y) * response;
      const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < .0008;
      if (settled) { x = targetX; y = targetY; }
      if (magnetic) {
        element.style.setProperty('--magnet-x', `${(x * 7).toFixed(2)}px`);
        element.style.setProperty('--magnet-y', `${(y * 5).toFixed(2)}px`);
      } else {
        element.style.setProperty('--light-x', `${((x + .5) * rect.width).toFixed(1)}px`);
        element.style.setProperty('--light-y', `${((y + .5) * rect.height).toFixed(1)}px`);
        element.style.setProperty('--tilt-x', `${(-y * 3.6).toFixed(3)}deg`);
        element.style.setProperty('--tilt-y', `${(x * 3.6).toFixed(3)}deg`);
        art?.style.setProperty('--scene-x', `${(x * 8).toFixed(2)}px`);
        art?.style.setProperty('--scene-y', `${(y * 4).toFixed(2)}px`);
      }
      // The interpolation loop ends as soon as it settles, including a stationary pointer.
      if (!settled) frame = requestAnimationFrame(draw);
      else lastTime = 0;
    }
    function move(event) {
      if (!motionAllowed() || !fine.matches || event.pointerType === 'touch') { reset(); return; }
      rect ??= element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      targetX = Math.max(-.5, Math.min(.5, (event.clientX - rect.left) / rect.width - .5));
      targetY = Math.max(-.5, Math.min(.5, (event.clientY - rect.top) / rect.height - .5));
      element.classList.add('is-pointed');
      if (!frame) frame = requestAnimationFrame(draw);
    }
    listen(element, 'pointerenter', move, { passive: true });
    listen(element, 'pointermove', move, { passive: true });
    listen(element, 'pointerleave', reset);
    listen(element, 'pointercancel', reset);
    pointerResets.set(element, reset);
    pointerObserver?.observe(element);
    resetters.push(reset);
  }
  document.querySelectorAll('[data-pointer-surface]').forEach(element => track(element));
  document.querySelectorAll('[data-magnetic]').forEach(element => track(element, true));
  const resetAll = () => resetters.forEach(reset => reset());
  const preference = () => { resetAll(); scene(); };
  listen(document, 'signal:motionchange', preference);
  listen(fine, 'change', preference);
  listen(window, 'scroll', resetAll, { passive: true });
  listen(window, 'resize', resetAll, { passive: true });
  listen(window, 'pagehide', () => { resetAll(); hero?.classList.remove('scene-running'); });
  listen(window, 'pageshow', scene);

  let signatureSeen = false;
  try { signatureSeen = sessionStorage.getItem('signal-signature') === 'seen'; } catch {}
  if (!signatureSeen && motionAllowed()) {
    const path = document.querySelector('.brand path');
    const animation = animateElement(path, [{ strokeDasharray: '1', strokeDashoffset: 1 }, { strokeDasharray: '1', strokeDashoffset: 0 }], { duration: 1100, delay: 60 });
    if (animation) {
      document.documentElement.classList.add('signature-enter');
      const end = () => document.documentElement.classList.remove('signature-enter');
      animation.addEventListener('finish', end, { once: true });
      animation.addEventListener('cancel', end, { once: true });
      try { sessionStorage.setItem('signal-signature', 'seen'); } catch {}
    }
  }
  return () => {
    resetAll();
    lifecycle.abort();
    observers.forEach(observer => observer.disconnect());
    candidates.forEach(element => cancelMotion(element));
    if (hero) { cancelMotion(hero); hero.classList.remove('scene-running'); }
  };
}

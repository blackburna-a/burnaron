import {animateElement, cancelMotion, motionAllowed} from './motion.js?v=20261021-controls2';

// The source is a complete reading experience. Enhance only after validating it.
export function initCasePlayer(root) {
  const scenes = [...root.querySelectorAll('[data-scene]')];
  const controls = root.querySelector('[data-case-controls]');
  const steps = root.querySelector('[data-case-steps]');
  const status = root.querySelector('[data-case-status]');
  const progress = root.querySelector('progress');
  const fill = root.querySelector('[data-case-fill]');
  const play = root.querySelector('[data-case-play]');
  const previous = root.querySelector('[data-case-prev]');
  const next = root.querySelector('[data-case-next]');
  const speedControl = root.querySelector('[data-case-speed]');
  if (scenes.length !== 6 || !controls || !steps || !status || !progress || !fill || !play || !previous || !next || !speedControl) return;

  let index = 0, playing = false, completed = false, elapsed = 0, started = 0;
  let timer = null, progressMotion = null, speed = 1, visible = false, firstEntrance = true;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const buttons = scenes.map((scene, i) => {
    scene.id ||= `${root.id}-scene-${i + 1}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'case-phase';
    button.setAttribute('aria-controls', scene.id);
    const number = document.createElement('span');
    number.className = 'case-phase-number';
    number.textContent = String(i + 1).padStart(2, '0');
    const label = document.createElement('span');
    label.textContent = scene.dataset.label;
    button.append(number, label);
    button.addEventListener('click', () => select(i));
    steps.append(button);
    return button;
  });
  const duration = () => Math.max(8000, Number(scenes[index].dataset.duration) || 12000);
  const blocked = () => document.hidden || !visible || Boolean(document.querySelector('dialog[open]'));
  function update() {
    root.dataset.playing = String(playing);
    play.textContent = playing ? 'Pause' : completed ? 'Play again' : elapsed ? 'Resume' : 'Play walkthrough';
    play.setAttribute('aria-pressed', String(playing));
    previous.disabled = index === 0;
    next.disabled = index === scenes.length - 1;
    progress.value = index + 1;
    progress.setAttribute('aria-valuetext', `Step ${index + 1} of ${scenes.length}: ${scenes[index].dataset.label}`);
    root.querySelector('[data-case-count]').textContent = `${String(index + 1).padStart(2, '0')} / 06`;
    buttons.forEach((button, i) => {
      button.tabIndex = i === index ? 0 : -1;
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.dataset.complete = String(i < index);
    });
  }
  function stopClock() {
    if (playing) elapsed = Math.min(duration(), elapsed + (performance.now() - started) * speed);
    playing = false;
    clearTimeout(timer);
    timer = null;
    progressMotion?.cancel();
    progressMotion = null;
    fill.style.transform = `scaleX(${elapsed / duration()})`;
  }
  function pause() {
    stopClock();
    cancelMotion(scenes[index]);
    update();
  }
  function animateScene() {
    const scene = scenes[index];
    cancelMotion(root.querySelector('[data-case-stage]'));
    if (!motionAllowed() || blocked()) return;
    scene.querySelectorAll('[data-animate]').forEach((element, i) => {
      animateElement(element, [{opacity: 0, transform: 'translateY(14px)'}, {opacity: 1, transform: 'translateY(0)'}], {
        duration: 480, delay: Math.min(i * 75, 600), easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'backwards'
      });
    });
    scene.querySelectorAll('[data-draw]').forEach(path => {
      path.setAttribute('pathLength', '1');
      animateElement(path, [{strokeDasharray: '1', strokeDashoffset: 1}, {strokeDasharray: '1', strokeDashoffset: 0}], {duration: 1050, delay: 260, easing: 'cubic-bezier(.22,1,.36,1)'});
    });
    scene.querySelectorAll('[data-bar]').forEach((bar, i) => {
      animateElement(bar, [{transform: 'scaleY(.08)'}, {transform: 'scaleY(1)'}], {duration: 700, delay: 180 + i * 75, easing: 'cubic-bezier(.2,.75,.25,1)'});
    });
  }
  function render(announce = true) {
    scenes.forEach((scene, i) => { scene.hidden = i !== index; });
    fill.style.transform = 'scaleX(0)';
    update();
    if (announce) status.textContent = `Step ${index + 1} of 6: ${scenes[index].dataset.label}.`;
    animateScene();
  }
  function select(i) {
    pause();
    index = Math.max(0, Math.min(scenes.length - 1, i));
    elapsed = 0;
    completed = false;
    render();
  }
  function start() {
    if (blocked()) return;
    if (completed) { index = 0; elapsed = 0; completed = false; render(); }
    playing = true;
    started = performance.now();
    const remaining = Math.max(0, duration() - elapsed) / speed;
    progressMotion = animateElement(fill, [{transform: `scaleX(${elapsed / duration()})`}, {transform: 'scaleX(1)'}], {duration: remaining, easing: 'linear', fill: 'forwards'});
    timer = setTimeout(() => {
      stopClock();
      if (index === scenes.length - 1) {
        completed = true;
        status.textContent = 'Walkthrough complete. Explore any step or read the complete walkthrough below.';
        update();
      } else {
        index += 1; elapsed = 0; render(); start();
      }
    }, remaining);
    update();
  }
  play.addEventListener('click', () => playing ? pause() : start());
  previous.addEventListener('click', () => select(index - 1));
  next.addEventListener('click', () => select(index + 1));
  root.querySelector('[data-case-replay]').addEventListener('click', () => select(index));
  root.querySelector('[data-case-restart]').addEventListener('click', () => select(0));
  speedControl.addEventListener('change', () => {
    const resume = playing;
    pause();
    speed = Number(speedControl.value) || 1;
    if (resume) start();
  });
  steps.addEventListener('keydown', event => {
    const offsets = {ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1};
    let target;
    if (event.key in offsets) target = (index + offsets[event.key] + scenes.length) % scenes.length;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = scenes.length - 1;
    else return;
    event.preventDefault();
    select(target);
    buttons[index].focus({preventScroll: true});
  });
  // Reading a disclosure or selecting text should never race the next scene.
  root.addEventListener('click', event => { if (event.target.closest('.desk-evidence')) pause(); });
  root.querySelector('[data-case-stage]').addEventListener('pointerdown', pause);
  root.querySelector('[data-case-stage]').addEventListener('focusin', pause);
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) pause();
    else if (firstEntrance) { firstEntrance = false; animateScene(); }
  });
  observer.observe(root);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  document.addEventListener('signal:dialogchange', () => { if (document.querySelector('dialog[open]')) pause(); });
  motionQuery.addEventListener('change', pause);
  connection?.addEventListener('change', pause);
  window.addEventListener('pagehide', pause);

  const reading = document.querySelector('[data-case-reading]');
  function revealAnchor() {
    if (reading && /^#(?:step-[1-6]|outcomes)$/.test(location.hash)) reading.open = true;
  }
  if (reading) reading.open = false;
  revealAnchor();
  window.addEventListener('hashchange', revealAnchor);
  root.dataset.enhanced = 'true';
  controls.hidden = false;
  steps.hidden = false;
  root.querySelector('[data-case-progress]').hidden = false;
  render(false);
}

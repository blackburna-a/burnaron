import { animateElement, cancelMotion, motionAllowed } from './motion.js?v=20261021-controls2';

let bike, removal, observer, surpriseMark, surpriseRemoval;
let surpriseBag = [], previousSurprise;

function clearRide() {
  clearTimeout(removal);
  observer?.disconnect(); observer = null;
  if (bike) { cancelMotion(bike); bike.remove(); bike = null; }
}

export function rideBike(announce = () => {}) {
  clearRide();
  const road = document.querySelector('.bike-road');
  if (!road) return;
  road.closest('footer')?.scrollIntoView({ block: 'end', behavior: 'instant' });
  bike = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  bike.classList.add('motorcycle');
  bike.setAttribute('viewBox', '0 0 132 76');
  bike.setAttribute('aria-hidden', 'true');
  // A small cafe racer, drawn locally with independent wheels and suspension.
  const drawing = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg"><g class="bike-trails" fill="none" stroke="currentColor" stroke-linecap="round" opacity=".4"><path d="M2 30h17M6 37h12M0 44h12"/></g>
    <g fill="var(--bg)" stroke="currentColor" stroke-width="2.6">
      <g class="bike-wheel"><circle cx="28" cy="56" r="16"/><circle cx="28" cy="56" r="11" opacity=".4"/><path d="M28 40v32M12 56h32M17 45l22 22M17 67l22-22" stroke-width="1" opacity=".6"/></g>
      <g class="bike-wheel"><circle cx="104" cy="56" r="16"/><circle cx="104" cy="56" r="11" opacity=".4"/><path d="M104 40v32M88 56h32M93 45l22 22M93 67l22-22" stroke-width="1" opacity=".6"/></g>
    </g><g class="bike-body" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="m28 56 24-23 18 23H28l11-14h35m-4 14 15-30 19 30M85 26l-4-9h12"/>
      <path d="M47 32h19c8 0 11-5 16-7l-5-5H61Z" fill="currentColor"/>
      <path d="M34 30h20M39 27h13M61 46h13M72 58h13M98 33l10 3"/>
      <path d="M26 38c-8 0-14 3-17 9m81-4c6-9 19-10 27-3" opacity=".7"/>
      <path d="m60 19-10 13 20 8-5 15m-4-37 11 8 14 1"/>
      <path d="M59 12a7 7 0 1 1 14-1v5H62Z" fill="var(--surface)"/><path d="M67 10h6" stroke-width="1.5"/>
    </g></svg>`, 'image/svg+xml');
  bike.append(...[...drawing.documentElement.children].map(element => document.importNode(element, true)));
  road.append(bike);
  const currentBike = bike;
  announce('Sometimes the scenic route is the right one.');
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting && bike === currentBike) clearRide(); });
    observer.observe(road);
  }
  if (!motionAllowed()) {
    bike.style.left = 'calc(50% - 44px)';
    removal = setTimeout(clearRide, 4200);
    return;
  }
  const duration = 4600;
  const distance = road.clientWidth + 176;
  const rotations = distance / (2 * Math.PI * 16 * (88 / 132));
  const ride = animateElement(bike, [
    { transform: 'translateX(-100px)', offset: 0 },
    { transform: `translateX(${road.clientWidth + 76}px)`, offset: 1 }
  ], { duration, easing: 'cubic-bezier(.28,.15,.64,.88)' });
  bike.querySelectorAll('.bike-wheel').forEach(wheel => animateElement(wheel, [
    { transform: 'rotate(0deg)' }, { transform: `rotate(${rotations * 360}deg)` }
  ], { duration, easing: 'cubic-bezier(.28,.15,.64,.88)' }));
  animateElement(bike.querySelector('.bike-body'), [
    { transform: 'translateY(0)' }, { transform: 'translateY(-.8px)', offset: .4 }, { transform: 'translateY(0)' }
  ], { duration: 460, iterations: 10, easing: 'ease-in-out' });
  animateElement(bike.querySelector('.bike-trails'), [{ opacity: .1 }, { opacity: .55 }, { opacity: .15 }], { duration: 920, iterations: 5 });
  ride?.addEventListener('finish', () => { if (bike === currentBike) clearRide(); }, { once: true });
  removal = setTimeout(() => { if (bike === currentBike) clearRide(); }, duration + 200);
}

function clearSignature() {
  clearTimeout(surpriseRemoval);
  if (surpriseMark) { cancelMotion(surpriseMark); surpriseMark.remove(); surpriseMark = null; }
}

export function signature(announce = () => {}) {
  clearSignature();
  const logo = document.querySelector('.brand svg');
  if (!logo) return;
  const mark = document.createElement('div');
  mark.className = 'signature-pop';
  mark.dataset.surprise = 'signature';
  mark.setAttribute('aria-hidden', 'true');
  const ring = document.createElement('span');
  ring.className = 'signature-ring';
  mark.append(ring, logo.cloneNode(true));
  document.body.append(mark);
  surpriseMark = mark;
  if (motionAllowed()) {
    mark.classList.add('signature-surprise');
    animateElement(mark, [
      { opacity: 0, transform: 'translateY(12px) rotate(-9deg) scale(.78)' },
      { opacity: 1, transform: 'translateY(-3px) rotate(2deg) scale(1.04)', offset: .7 },
      { opacity: 1, transform: 'translateY(0) rotate(0) scale(1)' }
    ], { duration: 620 });
    animateElement(ring, [{ opacity: .7, transform: 'scale(.85)' }, { opacity: 0, transform: 'scale(1.38)' }], { duration: 1100, delay: 200 });
    animateElement(mark.querySelector('path'), [{ strokeDasharray: '1', strokeDashoffset: 1 }, { strokeDasharray: '1', strokeDashoffset: 0 }], { duration: 1000, delay: 130 });
  }
  finishSurprise(mark, announce, 'Still learning. Still taking things apart. Usually putting them back together.');
}

function finishSurprise(mark, announce, message) {
  surpriseRemoval = setTimeout(() => {
    if (surpriseMark !== mark) return;
    const exit = animateElement(mark, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.94)' }], { duration: 250 });
    if (!exit) { clearSignature(); return; }
    exit.addEventListener('finish', () => { if (surpriseMark === mark) clearSignature(); }, { once: true });
  }, 3400);
  announce(message);
}

function svgElement(name, attributes) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function scene(name) {
  clearSignature();
  const mark = document.createElement('div');
  mark.className = `surprise-scene surprise-${name}`;
  mark.dataset.surprise = name;
  mark.setAttribute('aria-hidden', 'true');
  document.body.append(mark);
  surpriseMark = mark;
  animateElement(mark, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420 });
  return mark;
}

function constellation(announce) {
  const mark = scene('constellation');
  const drawing = svgElement('svg', { viewBox: '0 0 320 190', fill: 'none' });
  const points = [[24,122],[67,64],[115,91],[164,35],[207,85],[253,58],[290,123],[226,151],[142,147]];
  const edges = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,2],[2,4]];
  edges.forEach(([a,b]) => drawing.append(svgElement('path', {
    d: `M${points[a].join(' ')}L${points[b].join(' ')}`, pathLength: 1,
    stroke: 'currentColor', 'stroke-width': 1, opacity: .45
  })));
  points.forEach(([cx,cy], i) => {
    drawing.append(svgElement('circle', { cx, cy, r: i === 3 ? 6 : 3, fill: 'currentColor' }));
    if ([1,3,6].includes(i)) drawing.append(svgElement('circle', { cx, cy, r: 11, stroke: 'currentColor', opacity: .2 }));
  });
  mark.append(drawing);
  drawing.querySelectorAll('path').forEach((edge, i) => animateElement(edge, [
    { strokeDasharray: '1', strokeDashoffset: 1, opacity: 0 },
    { strokeDasharray: '1', strokeDashoffset: 0, opacity: .45 }
  ], { duration: 800, delay: i * 80 }));
  drawing.querySelectorAll('circle').forEach((star, i) => animateElement(star, [
    { opacity: 0 }, { opacity: .85, offset: .45 }, { opacity: star.getAttribute('opacity') || 1 }
  ], { duration: 1400, delay: i * 55 }));
  finishSurprise(mark, announce, 'A few dots. A different perspective. Keep looking for connections.');
}

function confetti(announce) {
  const mark = scene('confetti');
  for (let i = 0; i < 22; i++) {
    const piece = document.createElement('span');
    const angle = i * 2.39996;
    const radius = 42 + (i % 5) * 20;
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius * .62;
    const rotation = i * 47;
    piece.className = 'surprise-particle';
    piece.style.setProperty('--piece-x', `${x}px`);
    piece.style.setProperty('--piece-y', `${y}px`);
    piece.style.setProperty('--piece-turn', `${rotation}deg`);
    mark.append(piece);
    animateElement(piece, [
      { opacity: 0, transform: `translate(0,26px) rotate(0deg) scale(.3)` },
      { opacity: .85, transform: `translate(${x}px,${y - 24}px) rotate(${rotation}deg) scale(1)`, offset: .45 },
      { opacity: .7, transform: `translate(${x}px,${y}px) rotate(${rotation + 90}deg) scale(.9)` }
    ], { duration: 1800 + (i % 4) * 140, delay: (i % 6) * 32, easing: 'cubic-bezier(.16,.8,.3,1)' });
  }
  finishSurprise(mark, announce, 'A small celebration for following your curiosity.');
}

export function surprise(announce = () => {}) {
  // Shuffle in groups of three, with no repeat across group boundaries.
  if (!surpriseBag.length) {
    surpriseBag = ['signature', 'constellation', 'confetti'];
    for (let i = surpriseBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [surpriseBag[i], surpriseBag[j]] = [surpriseBag[j], surpriseBag[i]];
    }
    if (surpriseBag[0] === previousSurprise) [surpriseBag[0], surpriseBag[1]] = [surpriseBag[1], surpriseBag[0]];
  }
  previousSurprise = surpriseBag.shift();
  ({ signature, constellation, confetti })[previousSurprise](announce);
}

document.addEventListener('signal:motionchange', () => {
  if (!motionAllowed()) { clearRide(); clearSignature(); }
});
window.addEventListener('pagehide', () => { clearRide(); clearSignature(); });

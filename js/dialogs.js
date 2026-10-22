import {animateElement, cancelMotion} from './motion.js?v=20261021-controls2';

let active = null;
const wired = new WeakSet();
const returnTargets = new WeakMap();
let scrollState;

function lockScroll() {
  if (scrollState) return;
  const body = document.body, root = document.documentElement;
  const properties = ['position', 'top', 'left', 'width', 'overflow'];
  scrollState = {x: window.scrollX, y: window.scrollY,
    styles: properties.map(name => [name, body.style.getPropertyValue(name), body.style.getPropertyPriority(name)])};
  root.classList.add('modal-open');
  body.classList.add('modal-open');
  // A fixed body also locks the document on mobile Safari. Keep its visual position.
  Object.assign(body.style, {position: 'fixed', top: `-${scrollState.y}px`, left: `-${scrollState.x}px`, width: '100%', overflow: 'hidden'});
}

function unlockScroll() {
  if (!scrollState) return;
  const {x, y, styles} = scrollState;
  scrollState = null;
  for (const [name, value, priority] of styles) {
    if (value) document.body.style.setProperty(name, value, priority);
    else document.body.style.removeProperty(name);
  }
  document.body.classList.remove('modal-open');
  // Restore synchronously, even when the site normally uses smooth scrolling.
  window.scrollTo({left: x, top: y, behavior: 'instant'});
  document.documentElement.classList.remove('modal-open');
}

function finishClose(dialog) {
  if (active !== dialog) return;
  active = null;
  unlockScroll();
  document.dispatchEvent(new CustomEvent('signal:dialogchange'));
  const target = returnTargets.get(dialog);
  if (target?.isConnected && !target.closest('dialog:not([open])')) target.focus({preventScroll: true});
  else document.querySelector('.brand')?.focus({preventScroll: true});
}

export function closeDialog(dialog = active) {
  if (!dialog?.open) return;
  cancelMotion(dialog);
  dialog.close();
  finishClose(dialog);
}

export function openDialog(dialog, trigger = document.activeElement, initialFocus) {
  if (!dialog || typeof dialog.showModal !== 'function') return false;
  if (active === dialog) return true;
  if (active?.open) closeDialog(active);
  if (!wired.has(dialog)) {
    wired.add(dialog);
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('click', event => {
      if (event.target.closest('[data-close]')) closeDialog(dialog);
    });
    let backdropDown = false;
    const outside = event => {
      const r = dialog.getBoundingClientRect();
      return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
    };
    dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog && outside(event); });
    dialog.addEventListener('pointerup', event => {
      if (backdropDown && event.target === dialog && outside(event)) closeDialog(dialog);
      backdropDown = false;
    });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || event.defaultPrevented) return;
      const focusable = [...dialog.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex="0"]')]
        .filter(el => {
          const closedDetails = el.closest('details:not([open])');
          return !el.disabled && el.getClientRects().length && !el.closest('[hidden]') &&
            (!closedDetails || el === closedDetails.querySelector(':scope > summary'));
        });
      const first = focusable[0], last = focusable.at(-1);
      if (!first) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    // Also releases scroll if a browser or future native form closes the dialog.
    dialog.addEventListener('close', () => {
      if (!dialog.open) finishClose(dialog);
    });
  }
  returnTargets.set(dialog, trigger);
  lockScroll();
  try { dialog.showModal(); }
  catch { unlockScroll(); return false; }
  active = dialog;
  cancelMotion(dialog);
  animateElement(dialog, [{opacity: 0, transform: 'translateY(12px) scale(.985)'}, {opacity: 1, transform: 'translateY(0) scale(1)'}], {duration: 240, easing: 'cubic-bezier(.2,.75,.25,1)'});
  document.dispatchEvent(new CustomEvent('signal:dialogchange'));
  (initialFocus || dialog.querySelector('[data-close]'))?.focus({preventScroll: true});
  return true;
}

export function hasOpenDialog() { return Boolean(active?.open); }
